#!/usr/bin/env node
'use strict';

require('babel-polyfill');

var args = require('minimist')(process.argv.slice(2));
var chalk = require('chalk');
var exec = require('child_process').exec;
var GitHubApi = require('github');
var logSymbols = require('log-symbols');

// Number of tests required to have been run for success
var required_tests = args['required-tests'] || 1;

var github = new GitHubApi({
  // required
  version: '3.0.0',
  // optional
  headers: {
    'user-agent': 'github-ci-status'
  }
});

var state_to_logsymbol = {
  'success': { symbol: 'success', color: 'green' },
  'pending': { symbol: 'warning', color: 'yellow' },
  'error': { symbol: 'warning', color: 'yellow' },
  'failure': { symbol: 'error', color: 'red' }
};

// Get the current SHAsum.
function get_sha() {
  return new Promise(function (resolve, reject) {
    exec('git rev-parse HEAD', function (err, stdout, stderr) {
      if (err) {
        reject(err);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

// Get the GitHub repo details for the checked out path.
function get_user_repo() {
  return new Promise(function (resolve, reject) {
    exec('git config --get remote.origin.url', function (err, stdout, stderr) {
      if (err) {
        reject(err);
        return;
      }
      var url = stdout.trim();
      var parts = url.split('/');
      // GitHub URLs can have many forms, taking the last two path parameters
      // is the only robust way to discover the user/repo.
      var user = parts[parts.length - 2].replace('.git', '');
      var repo = parts[parts.length - 1].replace('.git', '');
      if (user.includes(':')) {
        // SSH-style git@github.com:foo
        user = user.split(':')[1];
      }
      resolve({ user: user, repo: repo });
    });
  });
}

// Get the CI status for the given commit
function check_status(user, repo, sha) {
  return new Promise(function (resolve, reject) {
    console.log('Checking ' + user + '/' + repo + ':' + sha.substring(0, 10) + '\n');
    github.statuses.getCombined({ user: user, repo: repo, sha: sha }, function (err, status) {
      if (err) {
        reject(err);
      } else {
        resolve(status);
      }
    });
  });
}

function print_each_status(statuses) {
  statuses.forEach(function (status) {
    if (status.state in state_to_logsymbol) {
      var symbol = state_to_logsymbol[status.state].symbol;

      console.log(logSymbols[symbol], status.description);
    } else {
      console.error('Unknown status received from github: ' + status.state);
      process.exit(1);
    }
  });
}

function start() {
  var status, sha, _ref, user, repo, _state_to_logsymbol$s, symbol, color, _state_to_logsymbol$e, _symbol, _color;

  return regeneratorRuntime.async(function start$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          status = void 0;
          _context.prev = 1;
          _context.next = 4;
          return regeneratorRuntime.awrap(get_sha());

        case 4:
          sha = _context.sent;
          _context.next = 7;
          return regeneratorRuntime.awrap(get_user_repo());

        case 7:
          _ref = _context.sent;
          user = _ref.user;
          repo = _ref.repo;
          _context.next = 12;
          return regeneratorRuntime.awrap(check_status(user, repo, sha));

        case 12:
          status = _context.sent;
          _context.next = 19;
          break;

        case 15:
          _context.prev = 15;
          _context.t0 = _context['catch'](1);

          console.error(logSymbols.warning, _context.t0.toString());
          process.exit(1);

        case 19:

          /* Exit codes:
           *
           * 0: all tests passed
           * 1: error getting status
           * 2: some tests failed
           * 3: some tests are pending
           * 4: the required number of tests weren't run
           */
          print_each_status(status.statuses);
          _state_to_logsymbol$s = state_to_logsymbol[status.state];
          symbol = _state_to_logsymbol$s.symbol;
          color = _state_to_logsymbol$s.color;
          _context.t1 = status.state;
          _context.next = _context.t1 === 'error' ? 26 : _context.t1 === 'failure' ? 29 : _context.t1 === 'pending' ? 32 : _context.t1 === 'success' ? 35 : 39;
          break;

        case 26:
          console.error(logSymbols[symbol], chalk[color]('CI tests errored'));
          process.exit(1);
          return _context.abrupt('break', 41);

        case 29:
          console.error(logSymbols[symbol], chalk[color]('CI tests failed'));
          process.exit(2);
          return _context.abrupt('break', 41);

        case 32:
          console.error(logSymbols[symbol], chalk[color]('CI still pending'));
          process.exit(3);
          return _context.abrupt('break', 41);

        case 35:
          if (status.statuses.length < required_tests) {
            _state_to_logsymbol$e = state_to_logsymbol['error'];
            _symbol = _state_to_logsymbol$e.symbol;
            _color = _state_to_logsymbol$e.color;

            console.error(logSymbols[_symbol], chalk[_color]('The required number of tests weren\'t run (' + status.statuses.length + ' vs ' + required_tests + ')'));
            process.exit(4);
          }
          console.log(logSymbols[symbol], chalk[color]('CI tests passed'));
          process.exit(0);
          return _context.abrupt('break', 41);

        case 39:
          console.error('Unknown status received from github: ' + status.state);
          process.exit(1);

        case 41:
        case 'end':
          return _context.stop();
      }
    }
  }, null, this, [[1, 15]]);
}

start();