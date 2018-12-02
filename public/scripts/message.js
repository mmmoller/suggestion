function Message(message){
    $("#message").removeClass("alert alert-danger alert-success")
    if (message.toString().charAt(0) == '!')
        $("#message").html(message.toString().slice(1)).addClass("alert alert-danger").show();
    else
        $("#message").html(message).addClass("alert alert-success").show();
    //setTimeout(function(){ $("#message").hide();}, 1500)
    $("#message").show().delay(1500).fadeOut()
}