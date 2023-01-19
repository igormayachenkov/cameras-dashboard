import React,{useEffect} from "react"
import { useSelector, useDispatch } from 'react-redux';
import { selectCheckedCameras } from "./camSlice";
import { selectImages, getImageKey, clear, clearChecked, loadImagesTail } from "./imgSlice";
import Cell from "./ImageCell"
import Selection from "./Selection"


export default (props)=>{
    const {list,status,showMore,checked} = useSelector(selectImages)
    const checkedCount = Object.keys(checked).length
    const checkedCameras = useSelector(selectCheckedCameras)
    const dispatch = useDispatch()
    console.log("=> ImgList")

    useEffect(()=>{
        console.log('***** ImgList.reloadImages on checkedCameras change', checkedCameras)
        dispatch(clear())
        if(Object.keys(checkedCameras).length){
            dispatch(loadImagesTail())
        }
    },[checkedCameras])    

    return (<>
        <div>
            <div className="cell-container">
                {list.map(image=>{
                    const key = getImageKey(image)
                    return <Cell 
                        key={key} 
                        data={image}
                        showCamera={true}
                        isChecked={Boolean(checked[key])}/>
                })}

                {status==="pending" && 
                <div className="last-cell">
                    <span>LOADING...</span>
                </div>}

                {showMore &&
                <div className="last-cell">
                    <span className="btn clk" onClick={()=>{dispatch(loadImagesTail())}}>show more</span>
                </div>}

            </div>
        </div>
        {checkedCount>0 && 
            <Selection 
                size={checkedCount}
                onClear ={()=>{dispatch(clearChecked())}}
                onDelete={()=>{}}/>
        }

    </>);
}
/* <Selection 
size={checkedCount}
onClear ={this.clearSelection}
onDelete={this.deleteSelected}/> */
