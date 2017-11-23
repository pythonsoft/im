const request = require('request');
const fs = require('fs');
const path = require('path');

const api = {};

const composeTemplate = function composeTemplate(version, updateList) {
  return `
{
  "version": "${version}",
  "updateList": [
    ${updateList.join(',\n    ')}
  ]
}
`;
};

api.create = function (version, generatePath, cb) {
  if (!version) {
    return cb && cb('version is null.');
  }

  if (!generatePath) {
    return cb && cb('generatePath is null.');
  }

  if (!fs.existsSync(generatePath)) {
    return cb && cb('generatePath is not exist');
  }

  request(`http://gitlab.szdev.cn/dev/UMP-FE/issues?private_token=vKXd3Vzzr_dPwKVkpxF8&scope=all&utf8=%E2%9C%93&state=closed&milestone_title=${version}`, (error, response, data) => {
    if (error) {
      return cb && cb(error);
    }

    const issueReg = /<a href="\/dev\/UMP-FE\/issues\/[0-9]*">(.*)<\/a>/g;

    const mt = data.match(issueReg);
    let t = null;
    const rs = [];

    for (let i = 0, len = mt.length; i < len; i++) {
      t = mt[i];
      if (mt[i] && mt[i].match(issueReg)) {
        rs.push(`"${RegExp.$1}"`);
      }
    }

    const tpl = composeTemplate(version, rs);

    console.log('version.json:', tpl);

    fs.writeFileSync(path.join(generatePath, 'version.json'), tpl);

    return cb && cb(null, tpl);
  });
};

module.exports = api;

