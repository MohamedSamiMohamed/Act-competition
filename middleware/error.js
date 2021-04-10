module.exports= function (err,req,res,next) {
    console.log(err.message)
    res.status(500).send('Internal server error. Something failed')
}