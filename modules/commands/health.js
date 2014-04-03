var _ = require('lodash');
var utils = require('../utils');
var ssh = require('../ssh');

exports.run = function (args) {
  utils.argShift(args, 'name');

  if (!args.name) {
    utils.red('Missing [name] parameter.');
    return exports.help(args);
  }

  args.continueOnError = true;
  args._ = ['health'];

  var data = {};
  var old = utils.prefixPrint;
  utils.prefixPrint = function (name, color, line) {
    data[name] = data[name] || '';
    data[name] += line;
  };
  ssh(args, function () {
    var output = {};
    utils.prefixPrint = old;
    _.each(data, function (raw, name) {
      raw = prepareJSONformat(raw);
      var metrics;
      try {
        metrics = JSON.parse(raw);
        _.each(metrics, function (val, key) {
          if (_.isString(val) && key !== 'disk_space_used_percentage') {
            metrics[key] = parseFloat(val);
          }
        });
        metrics.processes = _.compact(metrics.processes);
        _.each(metrics.processes, function (process, key) {
          process = process.split(' ');
          var obj = {
            user: process.shift(),
            pid: parseInt(process.shift(), 10),
            'cpu%': parseFloat(process.shift()),
            'mem%': parseFloat(process.shift()),
            time: process.shift(),
            command: process.join(' ')
          };
          metrics.processes[key] = obj;
        });
        output[name] = metrics;
      } catch (e) {
        output[name] = {
          error: 'Unable to parse JSON output.'
        };
      }
    });
    console.log(JSON.stringify(output, null, 2));
  });
};

function prepareJSONformat(str) {
  str = str.split('{');
  str.shift();
  str = '{' + str.join('{');
  return sanitize(str);
}

function sanitize(str) {
  return str.replace(/[^\w\s\-\.\,\:\;\'\"\/\[\]\{\}\~\!\@\#\$\%\^\&\(\)\|<\>\/\?]/g, '');
}

exports.signatures = function () {
  return [
    '  overcast health [instance|cluster|all]'
  ];
};

exports.help = function (args) {
  utils.printArray([
    'overcast health [instance|cluster|all]',
    '  Export common health statistics in JSON format.'.grey,
    '  Expects an Ubuntu server, untested on other distributions.'.grey,
    '',
    '  Example JSON:'.grey,
    '  {'.grey,
    '    "my_instance_name": {'.grey,
    '      "cpu_load_1min": 0.53,'.grey,
    '      "cpu_load_5min": 0.05,'.grey,
    '      "cpu_load_15min": 0.10,'.grey,
    '      "disk_space_used_percentage": "72%",'.grey,
    '      "disk_space_total": 19592,            // in MB'.grey,
    '      "disk_space_used": 13445,             // in MB'.grey,
    '      "disk_space_available": 5339,         // in MB'.grey,
    '      "memory_total": 1000,                 // in MB'.grey,
    '      "memory_used": 904,                   // in MB'.grey,
    '      "memory_free": 96,                    // in MB'.grey,
    '      "memory_used_with_cache": 589,        // in MB'.grey,
    '      "memory_free_with_cache": 410,        // in MB'.grey,
    '      "swap_total": 255,                    // in MB'.grey,
    '      "swap_used": 124,                     // in MB'.grey,
    '      "swap_free": 131,                     // in MB'.grey,
    '      "open_tcp_connections": 152,'.grey,
    '      "processes": ['.grey,
    '        {'.grey,
    '          "user": "root",'.grey,
    '          "pid": 1,'.grey,
    '          "cpu%": 0,'.grey,
    '          "mem%": 0,'.grey,
    '          "time": "0:01",'.grey,
    '          "command": "/sbin/init"'.grey,
    '        }'.grey,
    '      ]'.grey,
    '    }'.grey,
    '  }'.grey
  ]);
};
