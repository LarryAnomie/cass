// The following code is taken from jsUnit 2.1.
// http://www.jsunit.net/
// It is available under several licenses: the GPL, LGPL, and MPL.
//
// The JSUnitException() class has been altered to
// display an alert box as well as throw a JavaScript exception.
//
// For documentation on these functions, see
// http://www.edwardh.com/jsunit/documentation/

function assert() {
  _validateArguments(1, arguments);
  var booleanValue=nonCommentArg(1, 1, arguments);

  if (typeof(booleanValue) != 'boolean')
    error('Bad argument to assert(boolean)');

  _assert(commentArg(1, arguments), booleanValue === true, 'Call to assert(boolean) with false');
}

function assertTrue() {
  _validateArguments(1, arguments);
  var booleanValue=nonCommentArg(1, 1, arguments);

  if (typeof(booleanValue) != 'boolean')
    error('Bad argument to assertTrue(boolean)');

  _assert(commentArg(1, arguments), booleanValue === true, 'Call to assertTrue(boolean) with false');
}

function assertFalse() {
  _validateArguments(1, arguments);
  var booleanValue=nonCommentArg(1, 1, arguments);

  if (typeof(booleanValue) != 'boolean')
    error('Bad argument to assertFalse(boolean)');

  _assert(commentArg(1, arguments), booleanValue === false, 'Call to assertFalse(boolean) with true');
}

function assertEquals() {
  _validateArguments(2, arguments);
  var var1=nonCommentArg(1, 2, arguments);
  var var2=nonCommentArg(2, 2, arguments);
  _assert(commentArg(2, arguments), var1 === var2, 'Expected ' + var1 + ' (' + typeof(var1) + ') but was ' + _displayStringForValue(var2) + ' (' + typeof(var2) + ')');
}

function assertNotEquals() {
  _validateArguments(2, arguments);
  var var1=nonCommentArg(1, 2, arguments);
  var var2=nonCommentArg(2, 2, arguments);
  _assert(commentArg(2, arguments), var1 !== var2, 'Expected not to be ' + _displayStringForValue(var2));
}

function assertNull() {
  _validateArguments(1, arguments);
  var aVar=nonCommentArg(1, 1, arguments);
  _assert(commentArg(1, arguments), aVar === null, 'Expected null but was ' + _displayStringForValue(aVar));
}

function assertNotNull() {
  _validateArguments(1, arguments);
  var aVar=nonCommentArg(1, 1, arguments);
  _assert(commentArg(1, arguments), aVar !== null, 'Expected not to be null');
}

function assertUndefined() {
  _validateArguments(1, arguments);
  var aVar=nonCommentArg(1, 1, arguments);
  _assert(commentArg(1, arguments), aVar === top.JSUNIT_UNDEFINED_VALUE, 'Expected undefined but was ' + _displayStringForValue(aVar));
}

function assertNotUndefined() {
  _validateArguments(1, arguments);
  var aVar=nonCommentArg(1, 1, arguments);
  _assert(commentArg(1, arguments), aVar !== top.JSUNIT_UNDEFINED_VALUE, 'Expected not to be undefined');
}

function assertNaN() {
  _validateArguments(1, arguments);
  var aVar=nonCommentArg(1, 1, arguments);
  _assert(commentArg(1, arguments), isNaN(aVar), 'Expected NaN');
}

function assertNotNaN() {
  _validateArguments(1, arguments);
  var aVar=nonCommentArg(1, 1, arguments);
  _assert(commentArg(1, arguments), !isNaN(aVar), 'Expected not NaN');
}



function _assert(comment, booleanValue, failureMessage) {
  if (!booleanValue)
    throw new JsUnitException(comment, failureMessage);
}

function error(errorMessage) {
  var errorObject         = new Object();
  errorObject.description = errorMessage;
  errorObject.stackTrace  = getStackTrace();
  throw errorObject;
}

function _validateArguments(expectedNumberOfNonCommentArgs, args) {
  if (!( args.length == expectedNumberOfNonCommentArgs ||
        (args.length == expectedNumberOfNonCommentArgs + 1 && typeof(args[0]) == 'string') ))
    error('Incorrect arguments passed to assert function');
}

function getStackTrace() {
  var result = '';

  if (typeof(arguments.caller) != 'undefined') { // IE, not ECMA
    for (var a = arguments.caller; a != null; a = a.caller) {
      result += '> ' + getFunctionName(a.callee) + '\n';
      if (a.caller == a) {
        result += '*';
        break;
      }
    }
  }
  else { // Mozilla, not ECMA
    // fake an exception so we can get Mozilla's error stack
    var testExcp;
    try
    {
      foo.bar;
    }
    catch(testExcp)
    {
      var stack = parseErrorStack(testExcp);
      for (var i = 1; i < stack.length; i++)
      {
        result += '> ' + stack[i] + '\n';
      }
    }
  }

  return result;
}

function parseErrorStack(excp)
{
  var stack = [];
  var name;
  
  if (!excp || !excp.stack)
  {
    return stack;
  }
  
  var stacklist = excp.stack.split('\n');

  for (var i = 0; i < stacklist.length - 1; i++)
  {
    var framedata = stacklist[i];

    name = framedata.match(/^(\w*)/)[1];
    if (!name) {
      name = 'anonymous';
    }

    stack[stack.length] = name;
  }
  // remove top level anonymous functions to match IE

  while (stack.length && stack[stack.length - 1] == 'anonymous')
  {
    stack.length = stack.length - 1;
  }
  return stack;
}

function nonCommentArg(desiredNonCommentArgIndex, expectedNumberOfNonCommentArgs, args) {
  return argumentsIncludeComments(expectedNumberOfNonCommentArgs, args) ?
    args[desiredNonCommentArgIndex] :
    args[desiredNonCommentArgIndex - 1];
}

function argumentsIncludeComments(expectedNumberOfNonCommentArgs, args) {
  return args.length == expectedNumberOfNonCommentArgs + 1;
}

function commentArg(expectedNumberOfNonCommentArgs, args) {
  if (argumentsIncludeComments(expectedNumberOfNonCommentArgs, args))
    return args[0];

  return null;
}

function getFunctionName(aFunction) {
  var name = aFunction.toString().match(/function (\w*)/)[1];

  if ((name == null) || (name.length == 0))
    name = 'anonymous';

  return name;
}

function JsUnitException(comment, message) {
  this.isJsUnitException = true;
  this.comment           = comment;
  this.jsUnitMessage     = message;
  this.stackTrace        = getStackTrace();
  
  alert(this.comment);
}

var JSUNIT_UNDEFINED_VALUE;
var JSUNIT_VERSION="2.1";
