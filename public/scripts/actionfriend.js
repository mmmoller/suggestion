function ActionFriend(index){
    //var rowIndex = index.parentNode.parentNode.rowIndex;
    var target_id = document.getElementById("id"+index.value);
    var adress = document.getElementById("adress"+index.value);
    $.post("/" + adress.value + "_friend",{target_id:target_id.value}, function(data){
        //document.getElementById("datatable").deleteRow(rowIndex);
        adress.value = (adress.value=="Add") ? "Remove" : "Add"
        index.innerHTML = adress.value
        Message(data.message)
    });
}