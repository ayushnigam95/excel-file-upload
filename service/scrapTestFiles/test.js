var stream = require('stream');
var util = require('util');
var Excel = require('exceljs');
var bl = require('bl');

var ExcelTransform = function (options) {
    stream.Transform.call(this, { objectMode: true });

    this.workbook = options.workbook;
    // you can make this optional by checking for it and
    // creating an empty worksheet if none provided
    this.worksheet = options.worksheet;
}

util.inherits(ExcelTransform, stream.Transform);

ExcelTransform.prototype._transform = function (doc, encoding, callback) {
    console.log(">>>>>>>>>>>> TRANSFORM", this)
    this.worksheet.addRow({ name: doc.name, id: doc.id });
    callback();
};

ExcelTransform.prototype._flush = function (callback) {
    console.log(">>>>>>>>>>>>>> FLUSH", this)
    this.workbook.commit(); // commit only when you're done

    var that = this;
    // bl drains the stream and create a Buffer object you can then push
    this.workbook.stream.pipe(bl(function (err, data) {
        that.push(data);
        callback();
    }));
};

// it's better to provide the workbook as a parameter to ExcelTransform
var workbook = new Excel.stream.xlsx.WorkbookWriter();
var worksheet = workbook.addWorksheet('sheet 1');
worksheet.columns = [{ header: 'id', key: 'id' },
{ header: 'name', key: 'name' }];

var rs = new stream.Readable({ objectMode: true });
rs.push({ name: 'one' , id: "ROW-0000000970"});
rs.push({ name: 'two', id: "ROW-0000000971" });
rs.push({ name: 'three', id: "ROW-0000000971" });
rs.push(null);

rs.pipe(new ExcelTransform({
    workbook: workbook,
    worksheet: worksheet
})).pipe(process.stdout);
