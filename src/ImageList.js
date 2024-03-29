import React from "react"
import {apiRequest} from './Backend'
import {formatDateTime} from './Utils'
import{getSelectedCamIds, getCameraById} from './App'
import Cell from "./ImageCell"
import Viewer from "./Viewer"
import './style/Viewer.css';
import Selection from "./Selection"


export var showViewer
export var hideViewer
export var selectImage


const MIN_LOADING_TIME = 500
const PAGE_SIZE = 14

class ImageList extends React.Component{
    constructor(props){
        console.log(`ImageList constructor`)
        super(props)

        this.state = {
            images  : [],
            error   : null,
            loading : false,
            hasMore : false,
            openImg : null,
            selected: new Set()
        }
        showViewer=this.showViewer.bind(this)
        hideViewer=this.hideViewer.bind(this)
        selectImage=this.selectImage.bind(this)
        this.loadData=this.loadData.bind(this)
        this.clearSelection=this.clearSelection.bind(this)
        this.deleteSelected=this.deleteSelected.bind(this)
    }

    showViewer(image){this.setState({openImg:image})}
    hideViewer()     {this.setState({openImg:null})}

    shouldComponentUpdate(nextProps, nextState) {
        // props.onClick - GENERATES DIFFERENCE!
        
        // props.selCamID changed?
        if (this.props.selCamID !== nextProps.selCamID){
            console.log(`ImageList selCamID changed => skip update, start loading`)
            // Reload images
            this.loadData(true) // converts prop change to state change
        }

        // Updating on state change only!!!
        if(this.state!==nextState) return true;

        return false;
    }

    async loadData(reload){
        try{
            // Loading state
            const images = reload? [] : this.state.images
            const minTime = images.length>0?images[images.length-1].time : null
            console.log(`ImageList loadData, reload:${reload} minTime:${minTime}`)
            this.setState({
                images : images,
                error  : null,
                loading: true
            })

            // LOAD DATA
            const timeStart = new Date().getTime()
            let data = await apiRequest('POST','/cameras/load_images',{
                ids   : getSelectedCamIds(),
                limit : PAGE_SIZE,
                before: minTime
            })
            // Timeout
            const timeout = MIN_LOADING_TIME-(new Date().getTime()-timeStart)
            console.log('ImageList load success',timeout,data)
            if(timeout>0){
                await new Promise((resolve)=>{
                    window.setTimeout(()=>{resolve()}, timeout)
                })
            }
            // Update state
            this.setState({
                images : [...images].concat(data),
                error  : null,
                loading: false,
                hasMore: data.length==PAGE_SIZE
            })
        }catch(error){
            console.log('ImageList load error',error)
            this.setState({
                error  : error.toString(),
                loading: false
            })
        }
    }
    //-----------------------------------------------------------------------------
    // SELECTION
    selectImage(image){
        const {selected} = this.state 
        if(selected.has(image)) 
            selected.delete(image)
        else 
            selected.add(image)
        this.setState({})
    }
    clearSelection(e){
        e.stopPropagation();
        this.state.selected.clear()
        this.setState({})
    }
    deleteSelected(e){
        e.stopPropagation();
        const {selected} = this.state

        // Confirm
        if(!window.confirm('Delete selected images?')) return

        // Prepare data
        let keys = []
        for(const image of selected.values()){
            keys.push({id:image.id, time:image.time})
        }

        // SEND REQUEST
        apiRequest('POST','/cameras/remove_images',{
            keys : keys
        })
        .then(data=>{
            console.log('ImageList remove_images success')
            // Remove the images directly
            const images = this.state.images.filter(image=>!selected.has(image))
            // Clear selection
            selected.clear()
            // Update state
            this.setState({images})    
        })
        .catch(error=>{
            console.log('ImageList remove_images error',error)
            window.alert(error)
        })
    }

    //-----------------------------------------------------------------------------
    // RENDER
    render(){
        const {selCamID} = this.props
        const {selected,openImg,images} = this.state
        console.log(`ImageList render, selCamID: #${selCamID}`)
        //let items = 
 
        return (<>
        <div>
            {/* <h3>Images from: {selCamID ? getCameraById(selCamID)?.name:'ALL CAMERAS'}</h3> */}

            {this.state.error && 
            <div className="message"><span className="err">{this.state.error}</span></div>}
            
            <div className={"cell-container"+(selected.size>0?" select-mode":"")}>
                {this.state.images.map(item=>
                    <Cell 
                        key={`${item.id}-${item.time}`} 
                        data={item}
                        showCamera={selCamID=='all'}
                        isSelected={selected.has(item)}/>
                )}

                {this.state.loading && 
                <div className="last-cell">
                    <span>LOADING...</span>
                </div>}

                {this.state.images.length>0 && this.state.hasMore && !this.state.loading &&
                <div className="last-cell">
                    <span className="btn clk" onClick={()=>{this.loadData(false)}}>show more</span>
                </div>}
            </div>
        </div>
        {selected.size>0 && 
            <Selection 
                size={selected.size}
                onClear ={this.clearSelection}
                onDelete={this.deleteSelected}/>
        }
        {openImg && 
            <Viewer openImg={openImg} list={images}/>}
        </>)
    }
}
export default ImageList;