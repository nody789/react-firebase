
function ImgModal({ show, handleClose, imageUrls, photoIndex, handlePrev, handleNext }) {
  return (
    <div className={`modal fade ${show ? 'show d-block' : ''}`} tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden={!show} style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content bg-transparent border-0">
          <div className="modal-header border-0">
            <h5 className="modal-title text-white" id="exampleModalLabel"><span className="text-white">{photoIndex + 1} / {imageUrls.length}</span>            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={handleClose} aria-label="Close"></button>
          </div>
          <div className="modal-body text-center position-relative">
            <button className="btn btn-none position-absolute start-0" style={{ top: '50%' }} onClick={handlePrev}>
              <i className="bi bi-chevron-left text-white" style={{ fontSize: '2rem' }}></i>
            </button>
            <img src={imageUrls[photoIndex]} className="img-fluid modal-image" alt="modal content" />
            <button className="btn btn-none position-absolute end-0" style={{ top: '50%' }} onClick={handleNext}>
              <i className="bi bi-chevron-right text-white" style={{ fontSize: '2rem' }}></i>
            </button>
          </div>
        
        </div>
      </div>
    </div>
  );
}

export default ImgModal