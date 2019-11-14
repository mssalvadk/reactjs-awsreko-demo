import React from 'react'

import { 
    getThumbSize
} from './functions'

class MyCanvas extends React.Component {
 
    constructor (props) {
        super(props)
        this.myCanvasRef = React.createRef()
        this.thumbWidth = 80
        this.thumbHeight = 80
        
        this.canvasOnClick = this.props.onClick

        this.imageDetails = this.props.faces;  
        this.compareSource = this.props.compareSrc 
    }

    componentDidMount() {
        this.updateCanvas();
    }

    updateCanvas() {        
        const imageDetails = this.imageDetails

        const canvas = this.myCanvasRef.current
        const ctx = canvas.getContext('2d');
        
        const { width, height } = getThumbSize(this.thumbWidth, imageDetails.width, imageDetails.height);
        
        canvas.width = width; 
        canvas.height = height;
        ctx.drawImage(
            this.props.origSrc,
            imageDetails.x,
            imageDetails.y,
            imageDetails.width,
            imageDetails.height,
            0,
            0,
            width,
            height
        )
    }

    render() {
        const { description, rank, similarity } = this.imageDetails;
        return (
            (this.compareSource === undefined) ? 
            <div className="col">
                <canvas className="dropzone-image-preview rounded-circle" ref={this.myCanvasRef} onClick={this.canvasOnClick} ></canvas>
            </div> : 
            <tr>
                    <td align="left"><b># { rank }</b></td>
                    <td align="left">
                        <canvas className="dropzone-image-preview rounded-circle" ref={this.myCanvasRef} onClick={this.canvasOnClick} ></canvas>
                    </td>
                    <td align="left">
                        <span data-toggle="tooltip" title={'Similarity score: ' + similarity + '%'}>
                            { description }
                        </span>
                    </td>
            </tr>
        );
    }
}

export default MyCanvas;