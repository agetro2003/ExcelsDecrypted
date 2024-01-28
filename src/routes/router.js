

const router = require('express').Router();
const multer = require('multer');
const xlsx = require('xlsx');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const comparateData = (data) => {
    let result = [];
    data.forEach(element => {
        if (result.length === 0) {
            result.push(element);
        } else if (result[0].Precio > element.Precio) {
            result = [];
            result[0] = element;
        } else if (result[0].Precio === element.Precio) {
            result.push(element);
        }
    });
    return result;
}

const readExcels = (files) => {
    const data = [];
    files.forEach(file => {
        const workbook = xlsx.readFile(path.join(__dirname, 'files', file));
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = xlsx.utils.sheet_to_json(sheet);
        data.push(json[0]);
    });
    return data;
}

function ReadAllFiles() {
    const directoryPath = path.join(__dirname, 'files');
    try {
        const files = fs.readdirSync(directoryPath);
        return files;
    } catch (err) {
        console.error('Unable to scan directory:', err);
        return [];
    }
}

const upload = multer({ dest: 'uploads/' }); // Carpeta donde se guardarán temporalmente los archivos
const privateKey = fs.readFileSync(path.join(path.resolve(), 'private.pem'));
// Función para desencriptar un archivo Excel
function decryptExcel(inputPath, privateKey) {
    // Leer el archivo encriptado
    const encryptedData = fs.readFileSync(inputPath);
  
    // Desencriptar con la clave privada
    const decryptedData = decryptLargeData(encryptedData, privateKey);
  
    // Convertir la cadena a objeto Excel
    const decryptedWorkbook = JSON.parse(decryptedData.toString());
    const workSheet = decryptedWorkbook.Sheets[decryptedWorkbook.SheetNames[0]]
    const data = xlsx.utils.sheet_to_json(workSheet)
    // Obtener el nombre del archivo
    const filename = data[0].Nombre; 
    const outputPath = path.join(__dirname, 'files', `${filename}.xlsx`); // Ruta donde se guardará el archivo desencriptado

    
    // Escribir el archivo desencriptado
    xlsx.writeFile(decryptedWorkbook, outputPath);

    return outputPath;
  }

  function decryptLargeData(data, privateKey) {
    const chunkSize = 256; // Tamaño del bloque, ajusta según tus necesidades
  
    // Divide los datos en bloques más pequeños
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
  
    // Desencriptar cada bloque
    const decryptedChunks = chunks.map(chunk => {
      try {
        return crypto.privateDecrypt(
          {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
          },
          chunk
        );
      } catch (error) {
        console.error('Error during decryption:', error.message);
        return Buffer.from([]); // Devolver un buffer vacío en caso de error
      }
    });
  
    // Concatenar los bloques desencriptados
    const decryptedData = Buffer.concat(decryptedChunks);
  
    return decryptedData;
  }


router.post('/upload', upload.single('archivo'), (req, res) => {
    // El archivo estará disponible en req.file
    const inputPath = req.file.path;
    // Desencriptar el archivo Excel
    const outputPath = decryptExcel(inputPath, privateKey);

    // Leer el archivo desencriptado
    const decryptedWorkbook = xlsx.readFile(outputPath);
    const filesNames = ReadAllFiles();
    const data = readExcels(filesNames);
    console.log(data);
    // Enviar el contenido del archivo como respuesta
    res.json(comparateData(data));
});

router.get('/view', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')
    );
});

module.exports = router;
