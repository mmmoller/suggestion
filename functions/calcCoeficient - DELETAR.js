module.exports = function (correlation){
    return Math.pow(Number((correlation.ratingSum+5)/(correlation.ratingCount+1)), 2)/10
}