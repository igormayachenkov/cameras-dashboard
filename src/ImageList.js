import React from "react"
import {apiRequest} from './Backend'
import {formatDateTime} from './Utils'
import{getSelectedCamIds} from './App'
import Cell from "./Cell"


const MIN_LOADING_TIME = 700
const PAGE_SIZE = 5

class ImageList extends React.Component{
    constructor(props){
        console.log(`ImageList constructor`)
        super(props)

        this.state = {
            images  : [],
            error   : null,
            loading : false,
            hasMore : false
        }

    }

    shouldComponentUpdate(nextProps, nextState) {
        // props.onClick - GENERATES DIFFERENCE!
        
        // props.selectedCamera changed?
        if (this.props.selectedCamera !== nextProps.selectedCamera){
            console.log(`ImageList selectedCamera changed => skip update, start loading`)
            // Reload images
            this.loadData(true) // converts prop change to state change
        }

        // Updating on state change only!!!
        if(this.state!==nextState) return true;

        return false;
    }

    loadData(reload){
        const images = reload? [] : this.state.images
        const minTime = images.length>0?images[images.length-1].time : null
        console.log(`ImageList loadData, minTime:${minTime}`)
        this.setState({
            images : images,
            error  : null,
            loading: true
        })

        const timeStart = new Date().getTime()
        apiRequest('POST','/cameras/load_images',{
            ids   : getSelectedCamIds(),
            limit : PAGE_SIZE,
            before: minTime
        })
        .then(data=>{
            const timeout = MIN_LOADING_TIME-(new Date().getTime()-timeStart)
            console.log('ImageList load success',timeout,data)
            window.setTimeout(function(){
                this.setState({
                    images : [...images].concat(data),
                    error  : null,
                    loading: false,
                    hasMore: data.length==PAGE_SIZE
                })
            }.bind(this),timeout>0?timeout:0)

        })
        .catch(error=>{
            console.log('ImageList load error',error)
            this.setState({
                error  : error.toString(),
                loading: false
            })

        })
    }

    //-----------------------------------------------------------------------------
    // RENDER
    render(){
        const {selectedCamera} = this.props
        console.log(`ImageList render, selectedCamera: #${selectedCamera?.id}`)
        //let items = 

        return (
        <div>
            <h3>Images from: {selectedCamera?selectedCamera.name:'ALL CAMERAS'}</h3>

            {this.state.error && 
            <div className="message"><span className="err">{this.state.error}</span></div>}
            
            <div className="cell-container">
                {this.state.images.map(item=>
                    <Cell 
                        key={`${item.id}-${item.time}`} 
                        data={item}/>
                )}

                {this.state.loading && 
                <div className="last-cell">
                    <span>LOADING...</span>
                </div>}

                {this.state.images.length>0 && this.state.hasMore && !this.state.loading &&
                <div className="last-cell">
                    <span className="btn clk" onClick={()=>{this.loadData()}}>show more</span>
                </div>}
            </div>
        </div>)
    }
}
export default ImageList;