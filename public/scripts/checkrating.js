function CheckRating(index){
    if (index.value > 10)
        index.value = 10;
    if (index.value < 0)
        index.value = 0;
}