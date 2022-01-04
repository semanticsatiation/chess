import Piece from './piece';
import { pieceCharacteristics } from "../App";


function DeadPieces({pieces, classOption = ""}) {
    return (
        <ul className={`dead-pieces ${classOption}`}>{
            pieces.map((piece, ind) => (
                <li key={ind}>
                    <Piece
                        icon={pieceCharacteristics[piece[1]].chessPiece}
                        color={piece[2]}
                    />
                </li>
            ))
        }</ul>
    );
}

export default DeadPieces;