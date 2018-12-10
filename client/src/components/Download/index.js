import React, { Component } from "react";
import { ListItem, ListItemIcon, ListItemText } from '@material-ui/core'
import PropTypes from 'prop-types'
import connect from 'react-redux/es/connect/connect'
import { downloadFile, downloadFolder } from '../../services/api'
import { MdFileDownload } from 'react-icons/md'
import JSZip from 'jszip'
import saveAs from 'file-saver'

function base64ToArrayBuffer(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

//Create file(blob) and download (brower defined)
function saveByteArray(reportName, byte, type) {
    var blob = new Blob([byte], { type: type });
    var link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    var fileName = reportName;
    link.download = fileName;
    link.click();
}

const bulid = (data, path, zip) =>{
    for(let file of data.files){
        zip.file(path + file.fileName, file.data, {base64: true})
    }

    for(let folder of data.folders){
        bulid(folder, path + folder.folderName + '/', zip)
    }
}

class Download extends Component {
    constructor() {
        super()
        this.state = {
            open: false,
            dialogText: 'something went wrong if you see this'
        }
    }


    handleOpen = (message) => {
        this.setState({
            ...this.state,
            open: true,
            dialogText: message
        })
    }

    handleClose = () => {
        this.setState({
            ...this.state,
            open: false
        })
    }

    handleClick = () => {
        
        if (!this.props.selectedFile) {
            downloadFolder(this.props.selectedFolder)
                .then(response => {
                    console.log(response.folder)
                    let zip = new JSZip()
                    bulid(response.folder, '', zip)
                    zip.generateAsync({type:"blob"}).then(function(content) {
                        saveAs(content, response.folder.folderName);
                    });
                })
        } else {
            downloadFile(this.props.selectedFile)
                .then(response => { console.log(response); return response; })
                .then(response => {
                    if (response.result.statusCode === 200) {
                        //Create file and ask for download
                        saveByteArray(response.file.fileName, base64ToArrayBuffer(response.file.data, response.file.type))
                        this.handleOpen(response.result.message)
                    } else {
                        this.handleOpen(response.result.message)
                        console.log(response.result.message);
                    }
                })
                .catch(err => console.log(err))
        }
    }

    render() {
        return (
            <ListItem button onClick={this.handleClick}>
                <ListItemIcon>
                    <MdFileDownload />
                </ListItemIcon>
                <ListItemText primary="Download" />
            </ListItem>
        )

    }
}

Download.propTypes = {
    selectedFile: PropTypes.number,
    selectedFolder: PropTypes.number
}

const mapStateToProps = state => ({
    selectedFile: state.selectedFile,
    selectedFolder: state.selectedFolder
})

export default connect(mapStateToProps)(Download)