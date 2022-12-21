var stream = require('stream');
var util = require('util');
var Excel = require('exceljs');
var bl = require('bl');
var ExcelTransform = function(options) {
    stream.Transform.call(this, {
      writableObjectMode: true,
      readableObjectMode: false
    });
  
    this.workbook = options.workbook;
    var that = this;
    this.workbook.stream.on('readable', function() {
      var chunk = workbook.stream.read();
      if(chunk){
        that.push(chunk);
      }
      
    });
    this.worksheet = options.worksheet;
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
  
// it's better to provide the workbook as a parameter to the ExcelTransform
var workbook = new Excel.stream.xlsx.WorkbookWriter();
var worksheet = workbook.addWorksheet('sheet 1');
worksheet.columns = [{
    header: 'Name',
    key: 'name'
}];

var rs = new stream.Readable({ objectMode: true });
rs.push({ name: 'one' });
rs.push({ name: 'two' });
rs.push({ name: 'three' });
rs.push(null);

rs.pipe(new ExcelTransform({
    workbook: workbook,
    worksheet: worksheet
})).pipe(process.stdout);