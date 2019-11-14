  
  export function downloadBase64File (base64Data, filename) {
    var element = document.createElement('a')
    element.setAttribute('href', base64Data)
    element.setAttribute('download', filename)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }
    
  export function verifyFile (files, imageMaxSize, acceptedFileTypesArray) {
    if (files && files.length > 0) {
        const currentFile = files[0]
        const currentFileType = currentFile.type 
        const currentFileSize = currentFile.size 
        if (currentFileSize > imageMaxSize) {
            console.log('Image file is too big!')
            return false
        }
        if (!acceptedFileTypesArray.includes(currentFileType)) {
            console.log('Only image file is accepted.')
            return false
        }
        return true
    }
  }
  
  export function getThumbSize(maxWH, width, height) {
  
    if (width > height) {
      if (width > maxWH) {
          height *= maxWH / width;
          width = maxWH;
      }
    } else {
        if (height > maxWH) {
            width *= maxWH / height;
            height = maxWH;
        }
    }
  
    return { width, height }
    
  }

  export function getSimilarityDescription(similarity) {
      switch(true) {
          case (similarity >= 90) :
            return "Hey! This is the same person!";
          case (similarity < 90 && similarity >= 70) :
            return "Whoah! You got your doppelganger!";
          case (similarity < 70 && similarity >= 50) : 
            return "Oh, looks like a close relative!";
          case (similarity < 50 && similarity >= 30) : 
            return "Yay! There's a slight resemblance!";
          default: 
            return "Almost but not quite. ;) Try again!";
      }
  }
  
  export function drawImageOnCanvas(canvas, img, crop) {
    const ctx = canvas.getContext('2d');
    
    const { sx, sy, swidth, sheight, x, y, width, height } = crop
    
    img.width = width; 
    img.height = height;
    canvas.width = width; 
    canvas.height = height;
    ctx.drawImage(img, sx, sy, swidth, sheight, x, y, width, height);
  }
  
  export function preloadImage(url) {               
    return new Promise((resolve, reject) => {
        var img = new Image();
        img.src = url;
        img.addEventListener('load', () => {
            return resolve(img)
        });
        img.addEventListener('error', reject); // don't forget this one
    });
  }