const {Storage} = require('@google-cloud/storage')
const path = require('path')
const serviceKey = path.join(__dirname, './keys.json')
const Excel = require('exceljs')
console.log("Service key",serviceKey)
const bucketName = "generic-data-bucket"
const storage = new Storage({
    keyFilename: serviceKey,
    projectId: 'intrepid-tape-360418',
  })
  var stream = require('stream');
const myBucket = storage.bucket(bucketName); 
const file = myBucket.file("output2.xlsx");
// const blobStream = file.createWriteStream({contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})


/**
 * TODO(developer): Uncomment the following lines before running the sample
 */
// The ID of your GCS bucket
// const bucketName = 'your-unique-bucket-name';

// The new ID for your GCS file
const destFileName = 'your-new-file-name';

// The content to be uploaded in the GCS file
const contents = 'your file content';

// Imports the Google Cloud client library

// Create a pass through stream from a string
const passthroughStream = new stream.PassThrough();




// passthroughStream.write(contents);
// passthroughStream.end();

const workbook = new Excel.stream.xlsx.WorkbookWriter({
  stream: passthroughStream,
});
const worksheet = workbook.addWorksheet('My Data Sheet')
worksheet.columns = [{
  header: 'name',
  key: 'name'
}, {
  header: 'id',
  key: 'id'
}];

const row = {id:"xyz", name:"ayush"}
worksheet.addRow(row).commit()
workbook.commit()

async function streamFileUpload() {
  passthroughStream.pipe(file.createWriteStream()).on('finish', () => {
    // The file upload is complete
  });

  console.log(`${destFileName} uploaded to ${bucketName}`);
}

streamFileUpload().catch(console.error);