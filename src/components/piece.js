import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function Piece({icon, color}) {
    return (
        <FontAwesomeIcon 
            className={`${color === "b" ? ("black-piece") : ("white-piece")}`}
            icon={icon}
        />
    );
}

export default Piece;