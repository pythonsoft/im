'use strict';

// const fs = require('fs');
// const path = require('path');
const parseString = require('xml2js').parseString;
const isStream = require('is-stream');

class Xml2Srt {
  constructor(input) {
    this.input = input;
  }

  getSrtStr(cb) {
    this.parseXmlSub((err, r) => cb && cb(err, this.xmlObj2Srt(r)));
  }

  replaceLastX2Y(str, x, y) {
    const cutIndex = str.lastIndexOf(x);
    return `${str.substring(0, cutIndex)}${y}${str.substring(cutIndex + 1)}`;
  }

  xmlObj2Srt(xmlObj) {
    let srt = '';

    // const SectionInfo = xmlObj.Document.TextSection[0].SectionInfo;
    if (!xmlObj) {
      return srt;
    }
    const TextScreen = xmlObj.Document.TextSection[0].TextScreen;

    // const writeStream = fs.createWriteStream('./test.srt', 'utf8');

    for (let i = 0; i < TextScreen.length; i += 1) {
      const curSrt = `${i + 1}\n`
      + `${this.replaceLastX2Y(TextScreen[i].TimeCodeIn[0], ':', ',')} --> ${this.replaceLastX2Y(TextScreen[i].TimeCodeOut[0], ':', ',')}\n`
      + `${TextScreen[i].TextBlock[0].String.join('\n')}\n\n`;
      srt += curSrt;
      // writeStream.write(curSrt);
    }
    // writeStream.end();

    return srt;
  }

  readXmlStr(input, cb) {
    if (isStream(input)) {
      let data = '';
      input
        .on('data', (chunk) => {
          data += chunk;
        })
        .on('error', err => cb && cb(err))
        .on('end', () => cb && cb(null, data));
    } else if (typeof input === 'string') {
      return cb && cb(null, input);
    } else {
      return cb && cb('Invalid sourceType!');
    }
  }

  parseXmlSub(cb) {
    this.readXmlStr(this.input, (err, data) => {
      if (err) {
        return cb && cb(err);
      }
      if (!data) {
        return cb && cb(null, '');
      }
      parseString(data, (err, r) => {
        if (err) {
          return cb && cb(err);
        }
        return cb && cb(null, r);
      });
    });
  }
}

module.exports = Xml2Srt;
