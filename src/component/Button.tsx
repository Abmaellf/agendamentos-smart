import {ButtonHTMLAttributes} from 'react';
import styles from './Button.module.css';

// type Props = React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLBodyElement>, HTMLBodyElement>

interface Props extends ButtonHTMLAttributes<HTMLBodyElement> {
    isHeader ?: boolean;
  }
export function Button( { isHeader=true, children, ...rest}: Props) {
    return(
        <button className={isHeader ? styles.container : styles.containerAside} {...rest}>
            {children}
        </button>
    )
}