import React from 'react';
import { 
  RiCloseLine, 
  RiWhatsappLine, 
  RiFacebookLine, 
  RiMailLine,
  RiShareLine,
  RiFileCopyLine,
  RiDownloadLine
} from 'react-icons/ri';
import { socialShareConfig } from '../config/socialShare';
import toast from 'react-hot-toast';
import { trackShare } from '../utils/analytics';

// Inline SVG for X (formerly Twitter) icon
const XIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={props.size || 24} height={props.size || 24} {...props}>
    <path d="M17.53 3H21L14.19 10.91L22.24 21H15.68L10.92 14.89L5.61 21H2L9.2 12.57L1.51 3H8.23L12.54 8.56L17.53 3ZM16.32 19H18.13L7.78 4.98H5.84L16.32 19Z" />
  </svg>
);

const ShareModal = ({ isOpen, onClose, pothole }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusText = (status) => {
    const statusMap = {
      reported: 'Reported',
      acknowledged: 'Acknowledged',
      in_progress: 'In Progress',
      resolved: 'Resolved'
    };
    return statusMap[status] || 'Reported';
  };

  const generateShareText = (platform) => {
    const config = socialShareConfig;
    
    switch (platform) {
      case 'whatsapp':
        return config.templates.whatsapp(pothole, config);
      case 'twitter':
        return config.templates.twitter(pothole, config);
      case 'facebook':
        return config.templates.facebook(pothole, config);
      case 'email':
        return config.templates.email(pothole, config);
      default:
        return config.templates.whatsapp(pothole, config);
    }
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(generateShareText('whatsapp'));
    window.open(`https://wa.me/?text=${text}`, '_blank');
    trackShare('whatsapp');
    toast.success('Opening WhatsApp...');
    onClose();
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(generateShareText('twitter'));
    
    // For Twitter, we can try to include image URL if available
    if (pothole.media && pothole.media.length > 0) {
      const imageUrl = pothole.media[0].url;
      // Note: Twitter doesn't support direct image sharing via URL params
      // But we can include the image URL in the text
      const textWithImage = `${generateShareText('twitter')}\n\n📷 Image: ${imageUrl}`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(textWithImage)}`, '_blank');
    } else {
      window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    }
    
    trackShare('twitter');
    toast.success('Opening Twitter...');
    onClose();
  };

  const shareToFacebook = () => {
    const text = encodeURIComponent(generateShareText('facebook'));
    const reportUrl = `${socialShareConfig.websiteUrl}/report/${pothole._id}`;
    
    // Facebook sharing with image support
    if (pothole.media && pothole.media.length > 0) {
      const imageUrl = pothole.media[0].url;
      // Facebook sharer supports image URL parameter
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(reportUrl)}&quote=${text}&picture=${encodeURIComponent(imageUrl)}`, '_blank');
    } else {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(reportUrl)}&quote=${text}`, '_blank');
    }
    
    trackShare('facebook');
    toast.success('Opening Facebook...');
    onClose();
  };

  const shareViaEmail = () => {
    const { subject, body } = generateShareText('email');
    
    // Enhanced email sharing with image attachment support
    let emailBody = body;
    if (pothole.media && pothole.media.length > 0) {
      const imageUrl = pothole.media[0].url;
      emailBody += `\n\n📷 Pothole Image: ${imageUrl}`;
    }
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoLink, '_blank');
    toast.success('Opening email client...');
    onClose();
  };

  const downloadImage = () => {
    if (pothole.media && pothole.media.length > 0) {
      const imageUrl = pothole.media[0].url;
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `pothole-report-${pothole._id}.jpg`;
      document.body.appendChild(link);
      link.click();
      if (typeof link.remove === 'function') {
        link.remove();
      } else if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      toast.success('Image downloaded successfully!');
    } else {
      toast.error('No image available to download');
    }
  };

  const shareViaNative = () => {
    if (navigator.share) {
      const shareData = {
        title: `Pothole Report - ${pothole.location?.name}`,
        text: generateShareText('whatsapp'),
        url: `${socialShareConfig.websiteUrl}/report/${pothole._id}`
      };
      
      // Try to include image if available (supported by some browsers)
      if (pothole.media && pothole.media.length > 0 && navigator.canShare) {
        const imageUrl = pothole.media[0].url;
        
        // Check if files can be shared
        fetch(imageUrl)
          .then(response => response.blob())
          .then(blob => {
            const file = new File([blob], 'pothole-image.jpg', { type: blob.type });
            if (navigator.canShare({ files: [file] })) {
              shareData.files = [file];
            }
            return navigator.share(shareData);
          })
          .then(() => {
            onClose();
          })
          .catch((err) => {
            // If user canceled share or operation aborted, treat as benign and just close
            if (err?.name === 'AbortError' || /AbortError|The operation was aborted/i.test(err?.message || '') || err?.code === 20) {
              onClose();
              return;
            }
            // Fallback to text-only sharing
            navigator.share(shareData)
              .then(() => { onClose(); })
              .catch((e2) => {
                if (e2?.name === 'AbortError' || /AbortError|The operation was aborted/i.test(e2?.message || '') || e2?.code === 20) {
                  onClose();
                  return;
                }
                copyToClipboard();
              });
          });
      } else {
        navigator.share(shareData)
          .then(() => { onClose(); })
          .catch((err) => {
            if (err?.name === 'AbortError' || /AbortError|The operation was aborted/i.test(err?.message || '') || err?.code === 20) {
              onClose();
              return;
            }
            copyToClipboard();
          });
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = async () => {
    const text = generateShareText('whatsapp');
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Report text copied to clipboard!');
      onClose();
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  if (!isOpen || !pothole) return null;

  const shareOptions = [
    {
      id: 'native',
      name: 'Share',
      icon: RiShareLine,
      color: '#007AFF',
      action: shareViaNative,
      description: 'Use system share'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: RiWhatsappLine,
      color: '#25D366',
      action: shareToWhatsApp,
      description: 'Share via WhatsApp'
    },
    {
      id: 'twitter',
      name: 'X (formerly Twitter)',
      icon: XIcon,
      color: '#000000',
      action: shareToTwitter,
      description: 'Share on X (formerly Twitter)'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: RiFacebookLine,
      color: '#1877F2',
      action: shareToFacebook,
      description: 'Share on Facebook'
    },
    {
      id: 'email',
      name: 'Email',
      icon: RiMailLine,
      color: '#EA4335',
      action: shareViaEmail,
      description: 'Share via Email'
    },
    {
      id: 'download',
      name: 'Download Image',
      icon: RiDownloadLine,
      color: '#059669',
      action: downloadImage,
      description: 'Download pothole image',
      disabled: !pothole.media || pothole.media.length === 0
    },
    {
      id: 'copy',
      name: 'Copy Text',
      icon: RiFileCopyLine,
      color: '#6B7280',
      action: copyToClipboard,
      description: 'Copy to clipboard'
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-title-section">
              <h2 className="modal-title">Share Report</h2>
              <p className="modal-subtitle">
                Share this pothole report from {pothole.location?.name}
              </p>
            </div>
            <button className="modal-close-btn" onClick={onClose} title="Close">
              <RiCloseLine size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="share-options-grid">
            {shareOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.id}
                  className={`share-option-btn ${option.disabled ? 'disabled' : ''}`}
                  onClick={option.action}
                  disabled={option.disabled}
                  style={{ '--option-color': option.color }}
                >
                  <div className="share-option-icon">
                    <IconComponent size={24} />
                  </div>
                  <div className="share-option-content">
                    <span className="share-option-name">{option.name}</span>
                    <span className="share-option-description">{option.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal; 
