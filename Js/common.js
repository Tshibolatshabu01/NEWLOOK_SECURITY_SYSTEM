async function startQRScanner(guard){

    try{

        document.getElementById("qrScannerContainer").style.display = "block";

        // Prevent multiple scanners
        if(html5QrScanner){

            try{
                await html5QrScanner.stop();
            }catch(e){}

            try{
                await html5QrScanner.clear();
            }catch(e){}

            html5QrScanner = null;
        }

        html5QrScanner = new Html5Qrcode("qr-reader");

        await html5QrScanner.start(

            {
                facingMode:"environment"
            },

            {
                fps:10,
                qrbox:{
                    width:250,
                    height:250
                }
            },

            async(decodedText)=>{

                console.log("QR SCANNED:", decodedText);

                try{

                    await html5QrScanner.stop();

                }catch(e){}

                try{

                    await html5QrScanner.clear();

                }catch(e){}

                html5QrScanner = null;

                document.getElementById("qrScannerContainer").style.display = "none";

                await processCheckpointQR(decodedText, guard);

            },

            (errorMessage)=>{
                // Ignore continuous scan errors
            }

        );

    }catch(error){

        console.error("Scanner Error:", error);

        alert("Unable to start QR Scanner.");

    }

}
