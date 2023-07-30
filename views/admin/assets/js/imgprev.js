function previewImages() {
  var previewContainer = document.getElementById("imagePreview");
  previewContainer.innerHTML = ""; // Clear previous previews

  var files = document.querySelector('input[type="file"]').files;

  // Iterate through the selected files
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    var reader = new FileReader();

    // Closure to capture the file information and create the preview
    reader.onload = (function (file) {
      return function (event) {
        var imgContainer = document.createElement("div"); // Create a container for each image
        imgContainer.className = "img-container"; // Add a class to the container (you can style it later if needed)
        
        var img = document.createElement("img");
        img.className = "img-preview";
        img.src = event.target.result;
        
        imgContainer.appendChild(img); // Append the image to the container
        previewContainer.appendChild(imgContainer); // Append the container to the preview area
      };
    })(file);

    // Read the image file as a data URL
    reader.readAsDataURL(file);
  }
}

// Attach the function to the file input change event
document.getElementById("formFile1").addEventListener("change", previewImages);