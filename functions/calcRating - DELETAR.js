var calcCoeficient = require('./calcCoeficient - DELETAR.js');

module.exports = function (friendsOnly, suggestion, ownUser){
    var coeficient = 0;
    const defaultCoeficient = 2.5;
    var sum = defaultCoeficient;
    var rating = defaultCoeficient*5;
    for (var id in suggestion.userRating){
        if (suggestion.userRating.hasOwnProperty(id))
            //p 
            //p
            //p OwnID: #{ownUser._id} , ID: #{id}
            //| Name: #{infosys.usernames[id]} , rating: #{suggestion.userRating[id]} , Coeficient:
            if (ownUser.correlation[id] && (friendsOnly && ownUser.friendlist.indexOf(id) > -1 || !friendsOnly) ){
                if ( ownUser.correlation[id][suggestion.category] && ownUser.correlation[id][suggestion.category].ratingSum )
                    coeficient = calcCoeficient(ownUser.correlation[id][suggestion.category])
                else
                    coeficient = defaultCoeficient;
            } else if (!friendsOnly /*&& ownUser._id != id*/){
                coeficient = defaultCoeficient;
            } else {
                coeficient = 0;
            }
            rating += coeficient*suggestion.userRating[id]
            sum += coeficient;
    }
    if (sum != defaultCoeficient)
        return (Number((rating)/(sum)).toFixed(2))
    else
        return "#"
}