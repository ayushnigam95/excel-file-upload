const { Transform, Readable, pipeline } = require('stream');
var stream = require('stream');
const Excel = require('exceljs')
var bl = require('bl');
var util = require('util');
var fs = require("fs");
const { Storage } = require('@google-cloud/storage')
const path = require('path')
const serviceKey = path.join(__dirname, './keys.json')
console.log("Service key", serviceKey)
const bucketName = "generic-data-bucket"
const storage = new Storage({
    keyFilename: serviceKey,
    projectId: 'intrepid-tape-360418',
})
class StreamingService {
    static getOptions = (outStream, overrides = {}) => {
        const defaults = {
            preHook: () => { StreamingService.writeHead(outStream, 200) },
            errorHook: () => { StreamingService.writeHead(outStream, 500) },
            errorHandler: (error) => {
                if (!error) return;
                const { stack, message } = error;
                console.error({ error: Object.assign({}, error, { stack, message }) });
            }
        };
        return Object.assign(defaults, overrides);
    };

    static writeHead = (res, status = 200) => {
        if (typeof res.headersSent === 'boolean' && !res.headersSent) {
            res.writeHead(status, {
                'Content-Type': 'application/json; charset=utf-8',
                'Transfer-Encoding': 'chunked',
                'X-Content-Type-Options': 'nosniff'
            });
        }
    };

    static getTransform = (preHook) => {
        return new Transform({
            writableObjectMode: true,
            transform(data = {}, encoding, callback) {
                // preHook on first data only
                if (!this.comma) preHook();
                // if first data && error then no open/close brackets
                const prefix = this.comma || (data.error ? '' : '[');
                const suffix = this.comma && data.error ? ']' : '';
                this.push(`${prefix}${JSON.stringify(data)}${suffix}`);
                // set comma for subsequent data
                if (!this.comma) this.comma = ',\n';
                callback();
            },
            final(callback) {
                if (!this.comma) this.push('[');
                this.push(']');
                callback();
            }
        });
    };

    static streamData = (outStream, data, options = {}) => {
        if (!data) return outStream.end();
        const inStream = new Readable({ objectMode: true, read: () => { } });
        StreamingService.streamResponseHALF(outStream, inStream, options, data);
    };

    static streamResponseHALF = (outStream, inStream, options = {}, data = undefined) => {
        let passThroughStr = new stream.PassThrough()
        let workbook = new Excel.stream.xlsx.WorkbookWriter({
            stream: passThroughStr
        });
        let worksheet = workbook.addWorksheet('sheet 1');
        worksheet.columns = [
            { header: 'id', key: 'id', width: 30 },
            { header: 'name', key: 'name', width: 30 },
        ];

        const storage = new Storage({
            keyFilename: serviceKey,
            projectId: 'intrepid-tape-360418',
        })

        const myBucket = storage.bucket(bucketName);
        const file = myBucket.file("output9.xlsx");
        passThroughStr.pipe(file.createWriteStream()).on('finish', () => {
            // The file upload is complete
            console.log(`uploaded to ${bucketName}`);
        });

        const { preHook, errorHook, errorHandler } = StreamingService.getOptions(outStream, options);
        inStream.on('error', (error) => {
            errorHook();
            inStream.push({ error: error.message });
            outStream.end();
        });

        if (data) {
            // let workbook = new excel.Workbook();
            (Array.isArray(data) ? data : [data]).map(record => {
                // inStream.push(record)
                console.log("Record", record, typeof (record))
                // rs.push(record)
                worksheet.addRow(record).commit()
            });
            // inStream.push(null); // signal stream end
            // rs.push(null)
            workbook.commit()

        }

        

    };

    static streamResponse = (outStream, inStream, options = {}, data = undefined) => {
        let passThroughStr = new stream.PassThrough()
        let workbook = new Excel.stream.xlsx.WorkbookWriter({
            stream: passThroughStr
        });
        let worksheet = workbook.addWorksheet('sheet 1');
        worksheet.columns = [
            { header: 'id', key: 'id', width: 30 },
            { header: 'name', key: 'name', width: 30 },
        ];

        const storage = new Storage({
            keyFilename: serviceKey,
            projectId: 'intrepid-tape-360418',
        })

        const myBucket = storage.bucket(bucketName);
        const file = myBucket.file("outputF10.xlsx");
        passThroughStr.pipe(file.createWriteStream()).on('finish', () => {
            // The file upload is complete
            console.log(`uploaded to ${bucketName}`);
        });

        const { preHook, errorHook, errorHandler } = StreamingService.getOptions(outStream, options);
        inStream.on('error', (error) => {
            errorHook();
            inStream.push({ error: error.message });
            outStream.end();
        });
        inStream.on("data", data => {
            console.log("insr=tream data chunck", data)
            worksheet.addRow(data).commit()

        })
        inStream.on("end", ()=>{
            workbook.commit()
        })
        
    };
}

module.exports = StreamingService;
