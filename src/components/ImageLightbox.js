import FsLightbox from 'fslightbox-react';

const ImageLightbox = ({ isOpen, onClose, images, currentIndex }) => {
    return (
        <FsLightbox
            toggler={isOpen}
            sources={images}
            slide={currentIndex}
            onClose={onClose}
        />
    );
};

export default ImageLightbox;