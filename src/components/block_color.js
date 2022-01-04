function BlockColor({color}) {
    return (
        <div className={`block-color ${color === "b" ? ("black") : ("white")}`}></div>
    );
}

export default BlockColor;