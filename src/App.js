import { useState } from 'react';
import Piece from './components/piece';
import './stylesheets/chess.css';

const defaultBoard = [
  "0_r_b_1", "1_kn_b_1", "2_b_b_1", "3_q_b_1", "4_kg_b_1", "5_b_b_2", "6_kn_b_2", "7_r_b_2",
  "8_p_b_1", "9_p_b_1", "10_p_b_1", "11_p_b_1", "12_p_b_1", "13_p_b_1", "14_p_b_1", "15_p_b_1",
  "48_p_w_1", "49_p_w_1", "50_p_w_1", "51_p_w_1", "52_p_w_1", "53_p_w_1", "54_p_w_1", "55_p_w_1",
  "56_r_w_1", "57_kn_w_1", "58_b_w_1", "59_q_w_1", "60_kg_w_1", "61_b_w_2", "62_kn_w_2", "63_r_w_2",
];

function App() {
  const [boardState, setBoardState] = useState([...defaultBoard]);

  return (
    <ul className="chess-board center">{
      [...Array(8)].map((item, ind) => (
        <li className="row center" key={ind}>{
            [...Array(8)].map((item, i) => {
              const index = (ind * 8) + i;

              const piece = boardState.find((piece) => piece.split("_")[0] === `${index}`);

              return (
                <div className="block center">{
                  piece !== undefined ? (
                    <Piece piece={piece.split("_")}/>
                  ) : (null)
                }</div>
              );
            })
        }</li>
      ))
    }</ul>
  );
}

export default App;



