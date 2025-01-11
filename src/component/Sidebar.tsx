import styles from './Sidebar.module.css'

import imgFundo from '../assets/img_pilates.png';
import { Button } from './Button';

export function Sidebar() {
    return(
    <div className={styles.container}>

        <img className={styles.image} src={imgFundo}  />

        <div className={styles.imgButton}>
            <Button isHeader={false}>
                Agendar Agora

            </Button>
        </div>
           
        
    </div>
    )
}