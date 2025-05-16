const messages = [
          "Pondering Pandas",
          "Hop into ggplot",
          "Amphibian Arrays",
          "Tadpoles in Tables",
          "Bar Charts of Bullfrogs",
          "Tidy Toad",
          "Slimy Spreadsheets",
          "Croaking code",
          "Jumping on Jupyter",
          "Ponds are just Beautiful Soups",
          "Charming Snakes 🐍"
        ];
        
        window.onload = function() {
          // Get the last shown index from localStorage
          let lastIndex = localStorage.getItem("lastMessageIndex") || -1;
          lastIndex = parseInt(lastIndex);
          
          // Get a new random index that's different from the last one
          let newIndex;
          do {
            newIndex = Math.floor(Math.random() * messages.length);
          } while (newIndex === lastIndex && messages.length > 1);
          
          // Update the text
          document.getElementById("changing-text").textContent = messages[newIndex];
          
          // Save the current index for next time
          localStorage.setItem("lastMessageIndex", newIndex);
        }