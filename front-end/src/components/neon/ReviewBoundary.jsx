import React from 'react';
import {AlertTriangle,RotateCcw,X} from 'lucide-react';
import {Modal,Button} from '../UI.jsx';

export class ReviewBoundary extends React.Component{
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){
    if(!this.state.failed)return this.props.children;
    return <Modal title="Let's give that activity a fresh start." onClose={this.props.onClose} size="small"><div className="dialog-content"><AlertTriangle size={32}/><p>This activity couldn't load correctly. Your homework and completed progress are safe.</p><div className="dialog-actions"><Button variant="secondary" onClick={this.props.onClose}><X size={16}/>Back to learning</Button><Button onClick={()=>this.setState({failed:false})}><RotateCcw size={16}/>Try again</Button></div></div></Modal>;
  }
}
