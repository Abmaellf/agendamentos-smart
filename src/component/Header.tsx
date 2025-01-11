import styles from './Header.module.css';
import imgLogo from '../assets/BolaUnTra.png';
import '../global.css';

export function Header() {
    return(

        <div className={styles.header}>
            
           <img className={styles.image} src={imgLogo} />

           <div className={styles.main}>
                    <div className={styles.nameAndTitulo}>

                        <div className={styles.name}> Equilíbrio </div>

                        <div className={styles.titulo}> Fisioterapia & Pilates</div>

                    </div>

                    <button> Entrar </button>
            </div>

        </div>
       
    )
}