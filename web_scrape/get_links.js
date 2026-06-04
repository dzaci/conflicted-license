// spustit na podstranke browse
let site_links = ""
let a = document.querySelectorAll("a.w-inline-block.c-link-arrow")
for (let element of a) {
    site_links += element.href + "\n"
}

// copy to clipboard
await navigator.clipboard.writeText(site_links)