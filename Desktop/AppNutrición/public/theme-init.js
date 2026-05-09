(function(){
  try {
    var t = localStorage.getItem("annonia-theme");
    var d = document.documentElement;
    if (t === "dark") {
      d.classList.add("dark");
      d.style.colorScheme = "dark";
    } else {
      d.style.colorScheme = "light";
    }
  } catch(e) {}
})();
