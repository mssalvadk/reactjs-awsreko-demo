import React from 'react'
import classNames from 'classnames'
import Dropzone from 'react-dropzone'
import AWS from 'aws-sdk'

import { 
    getSimilarityDescription, 
    getThumbSize, 
    preloadImage, 
    verifyFile
} from './functions'
import MyCanvas from './MyCanvas.jsx'

const AWS_REGION = process.env.REACT_APP_AWS_REGION;
const AWS_IDENTITY_POOL_ID = process.env.REACT_APP_AWS_IDENTITY_POOL_ID;

AWS.config.region = AWS_REGION;
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: AWS_IDENTITY_POOL_ID
});

const imageMaxSize = 10485760; // bytes (10mb)
const acceptedFileTypes = ['image/x-png', 'image/png', 'image/jpg', 'image/jpeg', 'image/gif'];
const maxWH = 250; // max width and height of the preview of uploaded canvas images

const DivStep = ({title, note}) => (
    <div>
        <h1>{ title }</h1>
        <p className="dropzone-paragraph">{ note }</p>
    </div>
);

const UploadDangerAlert = ({onClick}) => (
    <div className="w-100 alert alert-danger" role="alert">
        <b>Multiple Faces Detected</b><br />
        <em>Choose one to select or <span className="span-btn" onClick={onClick}>click here</span> to upload a new one instead:</em>
    </div>
);

const UploadInfoAlert = ({onClick}) => (
    <div className="w-100 alert alert-info" role="alert">
        <b>Similarity score ranking is displayed below!</b><br />
        <em>Having fun? <span className="span-btn" onClick={onClick}>Click here</span> to retry!</em>
    </div>
);

const UploadSuccessAlert = () => (
    <div className="w-100 alert alert-success" role="alert">
        <b>Great!</b> Now proceed to Step 2 and upload the next photo.
    </div>
)

const CompareResult = ({result, src, compareSrc, onClick}) => (
    <div>
        <UploadInfoAlert onClick={onClick} />
        <div className="row">
            <div className="col"></div>
            <div className="col-md-6">
                <table cellPadding="5" cellSpacing="5" border="0" width="100%">
                    <tbody>
                    { result.map((arr,i) => <MyCanvas faces={arr} origSrc={src[1]} compareSrc={compareSrc} key={i} />) }
                    </tbody>
                </table>
            </div>
            <div className="col"></div>
        </div>
    </div>
)

class MyDropzone extends React.Component {

    constructor (props) {
        super(props)
        this.imgStep1CanvasRef = React.createRef()
        this.imgStep2CanvasRef = React.createRef()
        this.state = {
            imgStep1: [], 
            imgStep2: [], 
            imgStep1LoadStatus: 'not loaded',
            imgStep2LoadStatus: 'not loaded',
            imgStep1FaceDetails: [], 
            compareSource: null, 
            compareResult: []
        }
    }
    
    componentWillMount() {
        // save the current state into an initial state variable to make it easier to reset state later on
        this.initialState = this.state
    }

    handleOnDropForstep1Image = (acceptedFiles, rejectedFiles) => {
        if (rejectedFiles && rejectedFiles.length > 0) {
            const isVerified = verifyFile(rejectedFiles, imageMaxSize, acceptedFileTypes)
            if (!isVerified) {
                alert('Please check image size (<10mb) or file type (image).')
            }
        }

        this.onDrop(acceptedFiles, 'step1Image')
    }

    handleOnDropForParentImage = (acceptedFiles, rejectedFiles) => {
        if (rejectedFiles && rejectedFiles.length > 0) {
            const isVerified = verifyFile(rejectedFiles, imageMaxSize, acceptedFileTypes)
            if (!isVerified) {
                alert('Please check image size (<10mb) or file type (image).')
            }
        }

        this.onDrop(acceptedFiles, 'parentImage')
    }

    onDrop = async (acceptedFiles, stateFlag) => {

        if (acceptedFiles && acceptedFiles.length > 0) {
            const isVerified = verifyFile(acceptedFiles, imageMaxSize, acceptedFileTypes)
            if (isVerified) {
                const currentFile = acceptedFiles[0]
                const reader = new FileReader()
                
                if (stateFlag === 'step1Image') {
                    this.setState({
                        imgStep1LoadStatus : 'loading'
                    }) 
                } else {
                    this.setState({
                        imgStep2LoadStatus : 'loading'
                    })
                }

                reader.addEventListener("load", async () => {
                    const readerResult = reader.result
                    const img = await preloadImage(readerResult);

                    const imgArr = [readerResult.split(',')[1], img]
                    if (stateFlag === 'step1Image') {
                        this.setState({
                            imgStep1: imgArr
                        })
                        this.detectFaces(img, stateFlag)
                    } else {
                        this.setState({
                            imgStep2: imgArr
                        })
                        const { compareSource } = this.state;
                        this.compareFaces(compareSource, imgArr[0]);
                    }
                    
                }, false)
                reader.readAsDataURL(currentFile)
            } else {
                alert('Please check image size (<10mb) or file type (image).')
            }
        }
    }

    calculateBoundingLines(boundingBox, img) {
        /*
            Left coordinate = BoundingBox.Left (0.3922065) * image width (608) = 238
            Top coordinate = BoundingBox.Top (0.15567766) * image height (588) = 91
            Face width = BoundingBox.Width (0.284666) * image width (608) = 173
            Face height = BoundingBox.Height (0.2930403) * image height (588) = 172
        */
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;

        const x = boundingBox.Left * imgWidth;
        const y = boundingBox.Top * imgHeight;  
        const width = boundingBox.Width * imgWidth;
        const height = boundingBox.Height * imgHeight;
        return {
            x, y, width, height 
        }
    }


    updateStep1Canvas (img, faceObject, imageFlag) {
        const faces = faceObject.length;
        const { imgStep1 } = this.state;
        
        var imgPreloaded = imgStep1[1];
        this.setState({
            imgStep1LoadStatus: 'loaded'
        })
        
        if (faces === 1) {
            this.setState({
                compareSource: imgStep1[0]
            })
        }
        const canvas = this.imgStep1CanvasRef.current
        const ctx = canvas.getContext('2d');
        
        const origWidth = img.naturalWidth;
        const origHeight = img.naturalHeight;
        const { width, height } = getThumbSize(maxWH, origWidth, origHeight);
        
        img.width = width; 
        img.height = height;
        canvas.width = width; 
        canvas.height = height;
        ctx.drawImage(img, 0, 0, origWidth, origHeight, 0, 0, width, height);

        
        var ctr = 0;
        var imageDetailsArr = [];

        for (ctr=0;ctr<faces;ctr++) {
            const boundingBox = faceObject[ctr].BoundingBox;
            const ageRange = faceObject[ctr].AgeRange;
            
            // Get bounding boxes
            const { x, y, width, height } = this.calculateBoundingLines(boundingBox, imgPreloaded);

            // Save mapping values for the canvas element
            imageDetailsArr[ctr] = { x, y, width, height, age: ageRange }
        }

        this.setState({
            imgStep1FaceDetails: imageDetailsArr
        })
             
    }

    detectFaces = async (img, imageFlag) => {
        
        const src = img.src;
        const base64Image = src.split(',')[1]

        const rekognition = new AWS.Rekognition();
        const detectFaceRequest = rekognition.detectFaces(
            { Image: { Bytes: Buffer.from(base64Image, 'base64') }, Attributes: ["ALL"] }
        ).promise();
        
        let detectFaceResult = await detectFaceRequest;
        
        if (detectFaceResult.FaceDetails !== undefined && detectFaceResult.FaceDetails.length !== 0) {
            this.updateStep1Canvas(img, detectFaceResult.FaceDetails, imageFlag);
        } else {
            alert("No face detected, please re-upload a new image.");
            // no face detected, clear state for image upload
            if (imageFlag === 'step1Image') {
                this.setState({ 
                    imgStep1: []
                })
            } else {
                this.setState({ 
                    imgStep2: []
                })
            }
        }
    }

    compareFaces = async (source, target) =>  {
        
        const compareFaceParams = {
            SimilarityThreshold: 10,
            SourceImage: { Bytes: Buffer.from(source, 'base64') }, 
            TargetImage: { Bytes: Buffer.from(target, 'base64') }
        };

        const rekognition = new AWS.Rekognition();
        var compareFaceRequest = rekognition.compareFaces(compareFaceParams).promise();          
        let compareFaceResult = await compareFaceRequest;
        // console.log(compareFaceResult)
        if (compareFaceResult.FaceMatches !== undefined && compareFaceResult.FaceMatches.length !== 0) {
            var faceArr = compareFaceResult.FaceMatches;

            const { imgStep2 } = this.state;
            var faces = faceArr.length;
            var ctr = 0;
            var imageDetailsArr = [];
            for (ctr=0;ctr<faces;ctr++) {
                const boundingBox = faceArr[ctr]['Face'].BoundingBox;
                const similarity = Math.round(faceArr[ctr]['Similarity'] * 100) / 100;
                
                // Get bounding boxes
                const { x, y, width, height } = this.calculateBoundingLines(boundingBox, imgStep2[1]);

                const description = getSimilarityDescription(similarity)
                imageDetailsArr[ctr] = { x, y, width, height, similarity, rank: (ctr+1), description }
            }
            this.setState({ compareResult: imageDetailsArr })
        }
        
        
    
    }

    // public class fields syntax -> https://reactjs.org/docs/handling-events.html
    clearToDefault = (event) => {
        if (event) event.preventDefault()
        this.setState(this.initialState)
    }

    onThumbClick = (imageDetails) => {
        
        const { imgStep1 } = this.state;
        const canvas = this.imgStep1CanvasRef.current
        const ctx = canvas.getContext('2d');
        
        const { width, height } = getThumbSize(maxWH, imageDetails.width, imageDetails.height);
        
        canvas.width = width + 10; 
        canvas.height = height + 10;
        ctx.drawImage(
            imgStep1[1],
            imageDetails.x,
            imageDetails.y,
            imageDetails.width,
            imageDetails.height,
            5,
            5,
            width,
            height
        )

        const dataURL = canvas.toDataURL()
        this.setState({
            compareSource: dataURL.split(',')[1]
        })

    }

    render() {
        const {
            imgStep1, 
            imgStep1LoadStatus, 
            imgStep2,
            imgStep2LoadStatus, 
            imgStep1FaceDetails, 
            compareSource, 
            compareResult
        } = this.state; 
        return (
            <div className="container">
                
                { (compareResult.length > 0 && imgStep2.length > 0) ?  
                <CompareResult result={compareResult} src={imgStep2} compareSrc={compareSource} onClick={this.clearToDefault} />
                : 
                <div>
                    <div className="row" style={{padding:20 + 'px'}}>
                        
                        <div className="col-md-6">
                            { (compareSource !== null) ? <UploadSuccessAlert /> : null }
                            { (imgStep1LoadStatus === 'not loaded') ? 
                                <Dropzone onDrop={this.handleOnDropForstep1Image} accept='image/*' maxSize={imageMaxSize} multiple={false}>
                                {({getRootProps, getInputProps, isDragActive}) => {
                                    return (
                                        <div {...getRootProps()} className={classNames('dropzone', {'dropzone--isActive': isDragActive})}>
                                            <input {...getInputProps()} />
                                            <DivStep title='Step 1' note={ isDragActive ? 'Drag and drop the source photo here...' : "Use your own image.  Upload or drag and drop. Your image isn't stored."} /> 
                                        </div>
                                    )
                                }}
                                </Dropzone> : 
                                <div align="center">
                                    { (imgStep1LoadStatus === 'loading')  ? <div className="loader"></div> :
                                    <canvas className="dropzone-image-preview" ref={this.imgStep1CanvasRef}></canvas> 
                                    }
                                </div>
                            }
                        </div> 
                        { (compareSource !== null) ? 
                        <div className="col">
                            { (imgStep2LoadStatus === 'not loaded') ? 
                                <Dropzone onDrop={this.handleOnDropForParentImage} accept='image/*' maxSize={imageMaxSize} multiple={false}>
                                {({getRootProps, getInputProps, isDragActive}) => {
                                    return (
                                        <div {...getRootProps()} className={classNames('dropzone', {'dropzone--isActive': isDragActive})}>
                                            <input {...getInputProps()} />
                                            <DivStep title='Step 2' note={ isDragActive ? 'Drag and drop the second photo here...' : "Use your own image.  Upload or drag and drop. Your image isn't stored."} /> 
                                        </div>
                                    )
                                }}
                                </Dropzone> : 
                                <div align="center">
                                    { (imgStep2LoadStatus === 'loading')  ? <div className="loader"></div> :
                                    <canvas className="dropzone-image-preview" ref={this.imgStep2CanvasRef}></canvas> 
                                    }
                                </div>
                                
                            }
                        </div> : null }

                    </div>
                    <div className="row">

                        <div className="col-md-6">
                            <div className="row">
                                { imgStep1FaceDetails.length > 1 ? <UploadDangerAlert onClick={this.clearToDefault} /> : null } 
                                { (imgStep1FaceDetails.length > 1 && imgStep1.length > 0) ? 
                                imgStep1FaceDetails.map(
                                    (arr,i) => <MyCanvas faces={arr} origSrc={imgStep1[1]} onClick={ () => this.onThumbClick(arr) } key={i} />
                                )
                            : <div className="col"></div> }
                            </div>
                        </div>
            
                    </div>
                </div> }
            </div>
        );
    }
}

export default MyDropzone;