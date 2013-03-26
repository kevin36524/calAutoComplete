(function() {

    var regTime = "((\\d{1,2}):?(\\d{2})?\\s*(AM|PM)?)",
        regMonth = "((jan)(uary)?|(feb)(ruary)?|(mar)(ch)?|(apr)(il)?|(may)()?|(jun)(e)?|(jul)(y)?|(aug)(ust)?|(sep)(tember)?|(oct)(ober)?|(nov)(ember)?|(dec)(ember)?)",
        regDate = "((\\d{1,2})\\s*(st|nd|rd|th)?\\s*" + regMonth + ")",
        regLocation = "([^@]*)(?:" + delim + ")?",
        delim = "@@",
        regPrefix = "(.*\\s*)(?:" + delim + ")*",
        dictionaryArr = [{
            regex: new RegExp(regPrefix + "(at|from|between)\\s*" + regTime, "i"),
            fieldName: 'startTime'
        }, {
            regex: new RegExp(regPrefix + "(to|and)\\s*" + regTime, "i"),
            fieldName: 'endTime'
        }, {
            regex: new RegExp(regPrefix + "(to|till)\\s*" + regDate, "i"),
            fieldName: 'endDate'
        }, {
            regex: new RegExp(regPrefix + "(from|on)\\s*" + regDate, "i"),
            fieldName: 'startDate'
        }, {
            regex: new RegExp(regPrefix + "(at)\\s*" + regLocation , "i"),
            fieldName: 'venue'
        }],

        //prevObj and retObj will have the following fields
        // rawString - <String>raw inp string
        // fieldsAdded - <String array> 
        // fieldsRemoved - <String array> 
        // fieldsModified - <String array> 
        // fieldsPresent - <String array>
        // objsPresent - <Obj array>
        prevObj = {},
        retObj = {},
        fillObj = {
            startTime: function(resArr){
                 var timeObj = retObj.objsPresent.startTime;
                 timeObj.hours = resArr[4]; 
                 timeObj.mins = resArr[5]; 
                 timeObj.am_pm = resArr[6]; 
            },
            venue: function(resArr){
                 var venueObj = retObj.objsPresent.venue;
                 venueObj.venue = resArr[3];
            },
            title: function(resArr){
                 retObj.objsPresent.title.name = resArr[3];
            },
            startDate: function(resArr){
                 var dateObj = retObj.objsPresent.startDate,
                     monArr = resArr.splice(7),
                     shMon = resArr[6].slice(0,3);

                 dateObj.day = resArr[4]; 
                 dateObj.month = ((monArr.indexOf(shMon)+1)/2).toFixed();
            },
            endTime: function(resArr){
                 var timeObj = retObj.objsPresent.endTime;
                 timeObj.hours = resArr[4]; 
                 timeObj.mins = resArr[5]; 
                 timeObj.am_pm = resArr[6]; 
            },
            endDate: function(resArr){
                 var dateObj = retObj.objsPresent.endDate,
                     monArr = resArr.splice(7),
                     shMon = resArr[6].slice(0,3);

                 dateObj.day = resArr[4]; 
                 dateObj.month = ((monArr.indexOf(shMon)+1)/2).toFixed();
            }
        };

    var initRetObj = function (inp) {
        retObj = {};
        retObj.rawString = inp;
        retObj.fieldsAdded = [];
        retObj.fieldsRemoved = [];
        retObj.fieldsModified = [];
        retObj.fieldsPresent = [];
        retObj.objsPresent = {};
    };

    var checkAndUpdateRetObj = function(resArr,fieldName){

        if (retObj.objsPresent[fieldName]){
            // ignore the duplicates.
            return;
        }

        retObj.fieldsPresent.push(fieldName);

        retObj.objsPresent[fieldName] = {};
        retObj.objsPresent[fieldName].fieldString = resArr[2] + " " + resArr[3];

        if (prevObj.objsPresent && prevObj.objsPresent[fieldName]){
            if (prevObj.objsPresent[fieldName].fieldString == retObj.objsPresent[fieldName].fieldString){
                // unmodified field just copy from prev
                retObj.objsPresent[fieldName] = prevObj.objsPresent[fieldName];
            } else {
                // field modified
                retObj.fieldsModified.push(fieldName);
                fillObj[fieldName](resArr);
            }
        } else {
            // newly added field
            retObj.fieldsAdded.push(fieldName);
            fillObj[fieldName](resArr);
        }

    };


    var updateRetObjFieldsRemoved = function (){
        // both are same as they have same rawString
        if (retObj == prevObj) {
           retObj.fieldsAdded = [];
           retObj.fieldsRemoved = [];
           retObj.fieldsModified = [];
           return;
        }
        
        //compare retObj.fieldsPresent and prevObj.fieldsPresent and come up with retObj.fieldsRemoved
        if (prevObj && prevObj.fieldsPresent) {
            for (i=0; i < prevObj.fieldsPresent.length; i++) {
                if ( retObj.fieldsPresent.indexOf(prevObj.fieldsPresent[i]) == -1 ){
                    retObj.fieldsRemoved.push(prevObj.fieldsPresent[i]);
                }
            }
        }

    };


    var parse = function (inp) {
        var parseComplete = false,
            tempInp = inp,
            tempResult;

        initRetObj(inp);
            
        if (retObj.rawString == prevObj.rawString) {
           // no need to compute just return the prevObj
           retObj = prevObj;
           parseComplete = true;
        }


        /* find fragments from the input string thereby making it smaller and smaller */
        while (!parseComplete) {
            parseComplete = true;
            for (i = 0; i < dictionaryArr.length; i++) {
                tempResult = tempInp.split(dictionaryArr[i].regex);
                if (tempResult.length > 1) {
                    //found a match
                    tempInp = tempResult[1] + delim + tempResult[tempResult.length - 1];
                    parseComplete = false;
                    checkAndUpdateRetObj(tempResult,dictionaryArr[i].fieldName)
                    break;
                }
            }
        }

        // rest of the tempInp is the title
        checkAndUpdateRetObj(tempInp.split(/()()([^@]*)/),"title"); 

        /*Update the fieldsRemoved*/
        updateRetObjFieldsRemoved();

        /* return the return obj */
        prevObj = JSON.parse(JSON.stringify(retObj)); // makes a copy of retObj
        return retObj;

    }

    var clearPrevObj = function() {
        prevObj = {};
    }

    document.calParser = {parse: parse, clearPrevObj: clearPrevObj};

})();
