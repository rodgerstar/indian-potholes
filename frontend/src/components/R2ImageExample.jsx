import React, { useState } from 'react';
import R2Image from './R2Image';
import { buildR2Url, getThumbnailUrl, getResponsiveImageUrls } from '../utils/r2Utils';

/**
 * Example component demonstrating R2Image usage
 */
const R2ImageExample = () => {
  const [selectedSize, setSelectedSize] = useState('medium');
  
  // Example image URLs (replace with your actual R2 URLs)
  const exampleImages = [
    {
      id: 1,
      name: 'Pothole Report 1',
      url: buildR2Url('pothole-reports/1703123456789-abc123.jpg'),
      alt: 'A large pothole on the main road'
    },
    {
      id: 2,
      name: 'Pothole Report 2',
      url: buildR2Url('pothole-reports/1703123456790-def456.jpg'),
      alt: 'Multiple potholes in residential area'
    },
    {
      id: 3,
      name: 'Pothole Report 3',
      url: buildR2Url('pothole-reports/1703123456791-ghi789.jpg'),
      alt: 'Deep pothole near traffic signal'
    }
  ];

  const sizeOptions = [
    { value: 'thumbnail', label: 'Thumbnail (60px)' },
    { value: 'small', label: 'Small (100px)' },
    { value: 'medium', label: 'Medium (200px)' },
    { value: 'large', label: 'Large (300px)' },
    { value: 'banner', label: 'Banner (full width)' }
  ];

  const aspectRatios = [
    { value: 'aspect-1-1', label: 'Square (1:1)' },
    { value: 'aspect-4-3', label: 'Standard (4:3)' },
    { value: 'aspect-16-9', label: 'Widescreen (16:9)' },
    { value: 'aspect-3-2', label: 'Photo (3:2)' }
  ];

  return (
    <div className="r2-image-example">
      <h2>R2Image Component Examples</h2>
      
      {/* Basic Usage */}
      <section className="example-section">
        <h3>1. Basic Image Display</h3>
        <div className="example-grid">
          {exampleImages.map((image) => (
            <div key={image.id} className="example-item">
              <h4>{image.name}</h4>
              <R2Image
                src={image.url}
                alt={image.alt}
                width="200px"
                height="150px"
                className="aspect-4-3"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Size Variations */}
      <section className="example-section">
        <h3>2. Size Variations</h3>
        <div className="controls">
          <label>
            Select Size:
            <select 
              value={selectedSize} 
              onChange={(e) => setSelectedSize(e.target.value)}
            >
              {sizeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="example-grid">
          {exampleImages.map((image) => (
            <div key={image.id} className="example-item">
              <h4>{image.name}</h4>
              <R2Image
                src={image.url}
                alt={image.alt}
                className={selectedSize}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Aspect Ratios */}
      <section className="example-section">
        <h3>3. Aspect Ratios</h3>
        <div className="example-grid">
          {aspectRatios.map((ratio) => (
            <div key={ratio.value} className="example-item">
              <h4>{ratio.label}</h4>
              <R2Image
                src={exampleImages[0].url}
                alt={exampleImages[0].alt}
                className={`medium ${ratio.value}`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Advanced Features */}
      <section className="example-section">
        <h3>4. Advanced Features</h3>
        <div className="example-grid">
          <div className="example-item">
            <h4>With Fallback</h4>
            <R2Image
              src={exampleImages[0].url}
              alt={exampleImages[0].alt}
              fallbackSrc={getThumbnailUrl(exampleImages[0].url, 150)}
              className="medium aspect-16-9"
              onLoad={() => console.log('Image loaded successfully!')}
              onError={() => console.log('Image failed to load')}
            />
          </div>
          
          <div className="example-item">
            <h4>Custom Placeholder</h4>
            <R2Image
              src={exampleImages[1].url}
              alt={exampleImages[1].alt}
              placeholder="Loading pothole image..."
              className="medium aspect-4-3"
            />
          </div>
          
          <div className="example-item">
            <h4>No Lazy Loading</h4>
            <R2Image
              src={exampleImages[2].url}
              alt={exampleImages[2].alt}
              lazy={false}
              className="medium aspect-1-1"
            />
          </div>
        </div>
      </section>

      {/* Error Handling */}
      <section className="example-section">
        <h3>5. Error Handling</h3>
        <div className="example-grid">
          <div className="example-item">
            <h4>Invalid URL</h4>
            <R2Image
              src="https://invalid-url-that-does-not-exist.jpg"
              alt="This will show an error state"
              className="medium aspect-4-3"
            />
          </div>
          
          <div className="example-item">
            <h4>With Fallback on Error</h4>
            <R2Image
              src="https://invalid-url-that-does-not-exist.jpg"
              alt="This will show fallback"
              fallbackSrc={getThumbnailUrl(exampleImages[0].url, 150)}
              className="medium aspect-4-3"
            />
          </div>
        </div>
      </section>

      {/* Utility Functions Demo */}
      <section className="example-section">
        <h3>6. Utility Functions</h3>
        <div className="utility-demo">
          <h4>R2 URL Building</h4>
          <p><strong>Original path:</strong> pothole-reports/image.jpg</p>
          <p><strong>Full URL:</strong> {buildR2Url('pothole-reports/image.jpg')}</p>
          
          <h4>Responsive URLs</h4>
          <div className="responsive-urls">
            {Object.entries(getResponsiveImageUrls(exampleImages[0].url)).map(([size, url]) => (
              <div key={size} className="url-item">
                <strong>{size}:</strong> {url}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default R2ImageExample; 