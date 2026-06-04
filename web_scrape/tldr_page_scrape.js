let licenseName = document.querySelectorAll(".c-title-3")[0]
let allrestrict = document.querySelectorAll(".c-text-md")
let sections = ["Can", "Cannot", "Must", ""]
let section = -1
let foundStart = false
let data = {}
let restrictionNum = 0;
data.license = licenseName.innerHTML
data.restrictions = []

for (let element of allrestrict) {
	if (sections[section+1] === element.innerHTML) {
		foundStart = true
		section++
	}
	else if (foundStart) {
		data.restrictions.push({})
		data.restrictions[restrictionNum].type = sections[section]
		data.restrictions[restrictionNum].name = element.innerHTML
		data.restrictions[restrictionNum].description = element.firstChild.innerHTML
		restrictionNum++;
	}
}

console.log(JSON.stringify(data));

// let text = JSON.stringify(data)
// let blob = new Blob([text], {type: "text/plain"});
// let url = URL.createObjectURL(blob);
// let a = document.createElement("a");
// a.href = url;
// a.download = "license_"+licenseName.innerHTML; // saved in browser's download directory
// a.click();
// URL.revokeObjectURL(url);