module.exports = function (req, res, next) {
    if (banana == undefined){
        banana = 10;
    }
    else{
        banana++;
    }
    res.locals.banana = banana;
    next();
}

var banana;