var stream = require('stream');
var util = require('util');
var Excel = require('exceljs');
var fs = require("fs");

var ExcelTransform = function() {
  stream.Transform.call(this, {
    writableObjectMode: true,
    readableObjectMode: false
  });

  var writable = new stream.Writable({
    objectMode: false
  });
  var that = this;
  writable._write = function(chunk, encoding, next) {
    that.push(chunk);
    next();
  }

  this.workbook = new Excel.stream.xlsx.WorkbookWriter({ stream: writable });

  this.worksheet = this.workbook.addWorksheet('sheet 1');
  this.worksheet.columns = [{
    header: 'Name',
    key: 'name'
  }];
}

util.inherits(ExcelTransform, stream.Transform);

ExcelTransform.prototype._transform = function(doc, encoding, callback) {
  this.worksheet.addRow({
    name: doc.name
  }).commit();

  callback();
};

ExcelTransform.prototype._flush = function(callback) {
  this.workbook.commit(); // final commit
};


var rs = new stream.Readable({ objectMode: true });

var writable = fs.createWriteStream('output.xlsx');
rs.pipe(new ExcelTransform()).pipe(writable);

rs.push({ name: 'one' });
rs.push({ name: 'two' });
rs.push({ name: 'three' });
rs.push(null);