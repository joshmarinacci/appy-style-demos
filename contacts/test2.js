var OAuth = require('oauth').OAuth2;

var clientID ='609769202811-rrfurbu4j6295udd12b72sh5pq3lqeeq.apps.googleusercontent.com';
var clientSecret_ = 'OyJplw4yySkjDcplOR7POgD5';
var redirectUri_=  'urn:ietf:wg:oauth:2.0:oob';
var baseSite = "baseSite";
var authorizePath = "authorizePath";
var accessTokenPath ="accessTokenPath";
var customHeaders = [];
//var accessToken = "ya29.VgHGOcs_0DQgiIab48UNpu1l2ZkoT3km4cGYdU-keZuQy4pqCQEbwmmfW0F2EqrN7WGG7fMPZQaKyQ";
//var accessToken = "ya29.VwHQBlkOtT1eGFpqv68FsEiOr10dikJsdfOAW238OFcTbn-zlEhcvnRnhkrqu3fc1ReYn9QSP7x-qg";
var accessToken = "ya29.VwGLEFCzu3A9GPA10TmsOa0osu1A5ZZDog8vwZZFhIuQvawCBCVqfZVVrWWJJPLiD-tvP36YlRDg-A";

var oa = new OAuth(clientID, clientSecret_, baseSite, authorizePath,
    accessTokenPath, customHeaders);

console.log(oa);

// Example using GData API v3
// GData Specific Header
//oa._headers['GData-Version'] = '3.0';

oa.getProtectedResource("https://www.google.com/m8/feeds/contacts/default/full?alt=json",
    accessToken, function (error, data, response) {
        console.log(error);
        console.log(data);

    });
