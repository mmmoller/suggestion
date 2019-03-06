module.exports = function (req, res, next) {

    if (teste.length == 0){
        console.log("entrou no if")
        teste.push("não é mais para entrar")
    }

    if (!banana){
        banana = 10;
    }
    else{
        banana++;
    }
    res.locals.banana = banana;
    next();
}

var banana;
var teste = [];