// let promise = fetch('https://api-covid19.rnbo.gov.ua/data?to=2020-10-03')
// 	.then(response => response.json())
// 	// .then(json => {return json})

let ua, world, uaYesterday, worldYesterday
let confirmedDay = []
let totalConfirmed = 0
let totalDeaths = 0
let totalRecovered = 0
let totalConfirmedDay = 0
const uaElem = document.querySelector('.table-ua .table_body')
const worldElem = document.querySelector('.table-world .table_body')
const elemDate = document.getElementById('datePicker')

// elemDate.valueAsDate = new Date()
// elemDate.value = new Date().toJSON().slice(0, 10)//дата в формате JSON до 10 символа

Date.prototype.toDateInputValue = function () {//функция коррекции временной зоны
	let local = new Date(this)//текущая дата/время
	local.setMinutes(this.getMinutes() - this.getTimezoneOffset())//отнимаем от текущих минут временную зону
	return local.toJSON().slice(0, 10)
}

let todayDate = new Date().toDateInputValue()//new Date = this
elemDate.value = todayDate//забрасываем нашу дату корректируемую по гринвичу
elemDate.setAttribute('max', todayDate)//методом мах ограничиваем диапазон выбора даты

const getAPI = async (date) => {//передаём date котрый мы вызывали в dataOutput и передавали todayDate
	const url = 'https://api-covid19.rnbo.gov.ua/data?to=' + date
	const response = await fetch(url)
	const result = response.json()
	return result
}

// const getData = () => {
// 	let obj = getAPI()
// 			.then(e => {
// 				let ua = e.ukraine
// 				let world = e.world

// 				let uaElem = document.querySelector('#ukraune .container')
// 				let worldElem = document.querySelector('#world .container')
// 				return [ua, world]

// 			})

// }

// getData()

const htmlGenerate = (region) => {
	let resultTable = ``

	for (var row = 0; row < region.length; row++) {
		resultTable += `<tr class = "table-row">`
		resultTable += `<td class = "table-cell">${region[row].region}</td>`
		resultTable += `<td class = "table-cell">${region[row].confirmed}</td>`
		resultTable += `<td class = "table-cell">${region[row].deaths}</td>`
		resultTable += `<td class = "table-cell">${region[row].recovered}</td>`
		resultTable += `<td class = "table-cell">${region[row].confirmedDay}</td>`
		resultTable += `</tr>`
		
	}
		resultTable += `<tr class = "table-row total">`
		resultTable += `<td class = "table-cell">Загальна кількість</td>`
		resultTable += `<td class = "table-cell">${totalConfirmed}</td>`
		resultTable += `<td class = "table-cell">${totalDeaths}</td>`
		resultTable += `<td class = "table-cell">${totalRecovered}</td>`
		resultTable += `<td class = "table-cell">${totalConfirmedDay}</td>`
		resultTable += `</tr>`
	return resultTable
}

const defaultSort = async () => {
	let elem = document.querySelector('.active')
	let sortType = elem.getAttribute('data-sort')
	sortData(sortType, elem)
}

const dataOutput = async (date) => {
	let yesterdayDate = new Date(Date.now() - 86400000).toDateInputValue()
	const result = await getAPI(date)
	const resultYesterday = await getAPI(yesterdayDate)

	ua = result.ukraine.map((elem) => {
		return {
			'region': elem.label.uk,
			'confirmed': elem.confirmed,
			'deaths': elem.deaths,
			'recovered': elem.recovered
		}
	})
	world = result.world.map((elem) => {
		return {
			'region': elem.label.uk,
			'confirmed': elem.confirmed,
			'deaths': elem.deaths,
			'recovered': elem.recovered
		}
	})

	uaYesterday = resultYesterday.ukraine.map((elem) => {
		return {
			'region': elem.label.uk,
			'confirmed': elem.confirmed
		}
	})
	worldYesterday = resultYesterday.world.map((elem) => {
		return {
			'region': elem.label.uk,
			'confirmed': elem.confirmed
		}
	})

	for (var i = 0; i < ua.length; i++) {
		let item = ua[i]
		item.confirmedDay = item.confirmed - uaYesterday[i].confirmed
		totalConfirmed += item.confirmed
		totalDeaths += item.deaths
		totalRecovered += item.recovered
		totalConfirmedDay += item.confirmedDay
	}
	console.log(totalConfirmed, totalDeaths, totalRecovered, totalConfirmedDay)

	for (var i = 0; i < world.length; i++) {
		let item = world[i]
		let arr = worldYesterday.filter(function(elem) {
			return elem.region === item.region;
		});
		item.confirmedDay = item.confirmed - arr[0].confirmed
		totalConfirmed += item.confirmed
		totalDeaths += item.deaths
		totalRecovered += item.recovered
		totalConfirmedDay += item.confirmedDay
	}
	console.log(totalConfirmed, totalDeaths, totalRecovered, totalConfirmedDay)

	defaultSort()

	uaElem.innerHTML = htmlGenerate(ua)//забрасываем в таблицу на странице данные Ukraine
	worldElem.innerHTML = htmlGenerate(world)//забрасываем в таблицу на странице данные World

	barchartOutput()
}

dataOutput(todayDate)

//Работа с табами
const tabs = () => {
	let elemTabs = document.querySelector('.tabs')
	let eventTabShow
	const showTab = (tabsLinkTarget) => {
		let tabsPaneTarget, tabsLinkActive, tabsPaneShow
		tabsPaneTarget = document.querySelector(tabsLinkTarget.getAttribute('href'))//получили елемент соответствующий кликнутому табу
		tabsLinkActive = tabsLinkTarget.parentElement.querySelector('.tabs_link_active')//находим активную ссылку до клика
		tabsPaneShow = tabsPaneTarget.parentElement.querySelector('.tabs_pane_show')//находим видимую панель

		if (tabsLinkTarget === tabsLinkActive) {
			return
		}
		if (tabsLinkActive !== null) {
			tabsLinkActive.classList.remove('tabs_link_active')//убираем класс ..active у активной ссылки
		}
		if (tabsPaneShow !== null) {
			tabsPaneShow.classList.remove('tabs_pane_show')//убираем класс ..show у видимой панели
		}

		tabsLinkTarget.classList.add('tabs_link_active')//добавляем класс active кликнутому елементу
		tabsPaneTarget.classList.add('tabs_pane_show')//добавляем класс ..show  кликнутой панели

		barchartOutput()
	}

	elemTabs.addEventListener('click', (e) => {//вешаем событие клик
		let tabsLinkTarget = e.target
		if (!tabsLinkTarget.classList.contains('tabs_link')) {//проверяем НЕ содержит ли кликнутый елемент класс tabs_link
			return
		}
		e.preventDefault()//отменяем переход на якорь
		showTab(tabsLinkTarget)
	})
}

tabs()

const sortClick = async () => {
	const sortButtons = document.querySelectorAll('.sort')
	for (var i = 0; i < sortButtons.length; i++) {
		sortButtons[i].addEventListener('click', (e) => {
			let sortType = e.target.getAttribute('data-sort')//извлекаем атрибут для параметров сортировки
			sortData(sortType, e.target)
		})
	}
}

const sortData = (sortType, elemSort) => {
	let sortTypeArr = sortType.split('-')//ukraine,confirmed,up
	let sortRegion = sortTypeArr[0],//ukraine
		sortField = sortTypeArr[1],//confirmed
		sortDirection = sortTypeArr[2]//up

	let arrForSort = sortRegion === 'ukraine' ? ua : world//выбираем массив для сортировки
	// arrForSort.sort((a, b) => {
	// 	if (sortDirection === 'up') {
	// 		return a[sortField] > b[sortField] ? 1 : -1
	// 	}
	// 	return a[sortField] < b[sortField] ? 1 : -1
	// })

	// arrForSort.sort((a, b) => {
	// 	return sortDirection === 'up' ? (a[sortField].localeCompare(b[sortField])) : (b[sortField].localeCompare(a[sortField]))
	// })

	arrForSort.sort((a, b) => {
		if (typeof a[sortField] !== 'string') {//проверяем тип string или number
			if (sortDirection === 'up') {
				return a[sortField] - b[sortField]
			}
			return b[sortField] - a[sortField]
		}

		else if (sortDirection === 'up') {
			return a[sortField].localeCompare(b[sortField])
		}
		return b[sortField].localeCompare(a[sortField])
	})

	sortRegion === 'ukraine' ? uaElem.innerHTML = htmlGenerate(arrForSort) : worldElem.innerHTML = htmlGenerate(arrForSort)

	if (sortRegion === 'ukraine') {
		if (document.querySelector('#ukraine .sort.active') !== null) {
			document.querySelector('#ukraine .sort.active').classList.remove('active')//убираем класс active у остальных елементов если они у них были
		}
	}
	else {
		if (document.querySelector('#world .sort.active') !== null) {
			document.querySelector('#world .sort.active').classList.remove('active')//убираем класс active у остальных елементов если они у них были
		}
	}

	elemSort.classList.add('active')//присваиваем кликнотому елементу класс active

	barchartOutput()
}

sortClick()

elemDate.addEventListener('change', (event) => {//событие change отслеживает изменение елемента
	const chosenDate = event.target.value
	dataOutput(chosenDate)
})

const barchartGenerate = (region, confirmedMax) => {
	let result = ''
	for (var row = 0; row < region.length; row++) {
		result += `<div class="barchart-elem">
			<div class="barchart-elem_region">${region[row].region}</div>
			<div class="barchart-elem_graph"><span style="width: ${region[row].confirmed / confirmedMax * 100}%"></span></div>
			<div class="barchart-elem_number">${region[row].confirmed}</div>
		</div>`
	}
	return result
}

const barchartOutput = () => {
	let region = document.querySelector('.tabs_pane_show').getAttribute('id')//определяем какая вкладка активная и её id
	let arrForBarchart = region === 'ukraine' ? ua : world

	arrForBarchart = arrForBarchart.map((elem) => {
		return {
			'region': elem.region,
			'confirmed': elem.confirmed
		}
	})//из всего массива arrForBarchart создаём массив только по region и confirmed

	let arrForMax = arrForBarchart.map((elem) => elem.confirmed)//создаём массив только по confirmed
	let confirmedMax = Math.max(...arrForMax)//находим мах значение

	document.querySelector('.infographic-barchart').innerHTML = barchartGenerate(arrForBarchart, confirmedMax)//забрасываем результат генерации barchartGenerate в который передаём массив arrForBarchart и confirmedMax
}
