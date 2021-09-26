const IS_PI = navigator.userAgent.toLowerCase().indexOf("linux arm") >= 0
const CLICK_EVENT = 'click dragstart'

let frequent_items = []
let items = []

const AISLE_NAMES = {
  'produce': 'veg',
  'bakery/bread': 'bread',
  'milk, eggs, other dairy': 'dairy',
  'alcoholic beverages': 'alcohol',
  'canned and jarred': 'cans',
  'oil, vinegar, salad dressing': 'oil',
}

const get_id = (item) => {
  return items.find(o => o.name == item).id
}

const wire_remove = () => {
  $('.remove').off().on(CLICK_EVENT, function(){
    const el = $(this).parent()
    const id = el.attr('data-id')
    const name = el.contents().get(0).nodeValue
    $.ajax({
      url: `/clear_item/${id}/`,
      method: 'POST',
      data: {
        auth_key: auth_key
      },
      success: () => {
        const parent = el.parent()
        $(`[data-id=${id}]`).slideUp('fast', () => {
          if(parent.hasClass("aisle") && parent.find("li:visible").length === 1){
            parent.slideUp('fast')
          }
        })
        items = items.filter(i => i.name !== name)
        reflow_list()
        $(`#frequent .item[data-name="${name}"]`).show()
      }
    })
  })
}

const wire_frequent = () => {
  $('#frequent .item').on(CLICK_EVENT, function() {
    const el = $(this)
    if(!press_timedout){
      add_item(el.text(), () => {
        el.addClass("hidden")
      })
    }
    press_timedout = false
  }).on('mouseup touchend', (e) => {
      clearTimeout(press_timeout)
  }).on('mousedown touchstart', function(){
    const el = $(this)
    press_timeout = setTimeout(() => {
      return
      press_timedout = true
      if(confirm("Remove this favourite?")) {
        $.ajax({
          url: '/remove_frequent/',
          method: 'post',
          data: {
            auth_key: auth_key,
            name: el.text()
          },
          success: (data) => {
            el.remove()
          }
        })
      }
    }, 1000)
  })
  $('#frequent .item').onselectstart = function() {
    return false;
  }
  $('#frequent .item').unselectable = "on"
}

const reset_frequent = () => {
  $('#frequent').html("")
  frequent_items.filter((_, idx) => idx < 20).forEach(item => {
    const hidden = items.find(i => i.name === item.name) ? 'hidden' : ''
    $('#frequent').append(`<div data-name="${item.name}" class="item ${hidden}">${item.name}</div>`)
  })
  wire_frequent()
}

const display_frequent_with_filter = (term) => {
  if (!term) {
    reset_frequent()
    return
  }
  $('#frequent').html("")
  frequent_items.filter(item => item.name.toLowerCase().indexOf(term) >= 0).filter((_, idx) => idx < 20).forEach(item => {
    const hidden = items.find(i => i.name === item.name) ? 'hidden' : ''
    $('#frequent').append(`<div data-name="${item.name}" class="item ${hidden}">${item.name}</div>`)
  })
  wire_frequent()
}

const add_item = (name, cb) => {
  $.ajax({
      url: '/add_item/',
      method: 'POST',
      data: {
        auth_key: auth_key,
        name: name
      },
      success: (data) => {
        $('#list').append(`<div data-id="${data}" class="item">${name}<button class='remove'><i class="fa fa-2x fa-check"></i></button></div>`)
        wire_remove()
        reflow_list()
        $('#input').val('')
        items.push({name: name})
        reset_frequent()
        cb && cb()
      }
    })
  $('#frequent .item').removeClass("filtered")
}

let press_timeout = 0
let press_timedout = false

const refresh_items = () => {
  $.ajax({
    url: `/get_items/?auth_key=${auth_key}`,
    success: (data) => {
      if(data === 'authfail'){
        $('#list').text("Wrong password")
        $('form').hide()
        $('main').html("auth fail")
        return
      }
      if(localStorage){
        localStorage["password"] = auth_key
      }
      data = JSON.parse(data)
      $('#list').html("")
      items = data.items
      frequent_items = data.frequent

      items.forEach(item => {
        $('#list').append(`<div data-id="${item.id}" class="item">${item.name}<button class='remove'><i class="fa fa-2x fa-check"></i></button></div>`)
      })
      $('#frequent').html("")
      reset_frequent()
      wire_remove()
      reflow_list()
    }
  })
}

const show_parsed_recipe = (data) => {
  if(data.status && data.status !== 200) {
    $('.recipe .parsed').html(JSON.stringify(data))
  } else {
    $('.recipe .parsed').html(`
    <h1>Ingredients</h1>
    <ul>
    ${data.extendedIngredients.map(i => `<li>${i.originalString}</li>`).join('')}
    </ul>
    <h1>Method</h1>
    <ol>
    ${data.analyzedInstructions[0].steps.map(s => `<li>${s.step}</li>`).join('')}
    </ol>
    `)
  }
}

let recipe_mode = 0
let recipe_url

const switch_recipe = () => {
  if (recipe_mode == 0) {
    $('.recipe iframe').hide()
    $('.recipe').append(`<div class="parsed">Loading...</div>`)
    $.ajax({
      url: `/parse_recipe/`,
      method: 'POST',
      data: {
        url: recipe_url,
        auth_key: auth_key
      },
      success: (data) => {
        show_parsed_recipe(JSON.parse(data))
        $('button.switcher').prop('disabled', false)
      }
    })
    recipe_mode = 1
  } else {
    $('.recipe .parsed').remove()
    $('.recipe iframe').show()
    recipe_mode = 0
    $('button.switcher').prop('disabled', false)
  }
}

const check_recipe = () => {
  $.ajax({
    url: `/recipe/?auth_key=${auth_key}`,
    cache: false,
    method: 'GET'
  }).done((data) => {
    const response = JSON.parse(data)
    recipe_mode = 0
    if (response.url !== 'None') {
      $.ajax({
        url: '/recipe/',
        method: 'POST',
        data: {
          url: 'unset',
          auth_key: auth_key
        }
      })
      recipe_url = response.url
      const content = `
      <div class="recipe">
        <div class="buttonbar">
          <button class="switcher"><i class="far fa-file-alt"></i></button>
          <button class="closer"><i class="fa fa-times"></i></button>
        </div>
        <iframe
          is="x-frame-bypass"
          width="${$(document).outerWidth()}"
          height="${$(document).outerHeight() - 50}"
          frameborder="0"
          scrolling="yes"
          marginheight="0"
          marginwidth="0"
          src="${response.url}">
        </iframe>
      </div>`
      if ($('.recipe').length) {
        $('.recipe').html(content)
      } else {
        $('main').prepend(content)
        $('button.switcher').on('click', function() {
          $(this).prop('disabled', true)
          switch_recipe()
        })
        $('button.closer').on('click', () => {
          $('.recipe').remove()
        })
      }
    }
  })
}

const reflow_list = () => {
  $('#listwrapper').css({
    "height": $('#keyboard').offset().top - $('#listwrapper').offset().top
  })
}

const parse_aisle = (s) => {
  const translation = AISLE_NAMES[s]
  let result = translation ? translation : s
  return result.split(';')[0]
}

const initShopping = () => {
  $.ajax({
    url: '/item_data/?auth_key=' + auth_key,
    method: 'get',
    success: (data) => {
      const results = JSON.parse(data)
      const aisles = {}
      results.forEach(item => {
        const aisle = parse_aisle(item[1])
        if(aisles[aisle]) {
          aisles[aisle].push(item[0])
        } else {
          aisles[aisle] = [item[0]]
        }
      })
      Object.keys(aisles).forEach(aisle => {
        const rows = aisles[aisle].map(row => `
        <li data-aisle="${aisle}" data-id="${get_id(row)}" class="item">
        ${row}<button class='remove'><i class="fa fa-2x fa-check"></i></button>
        </li>`)
        $('#shopping').append($(`<ul class="aisle collapsed"><li class="title"><i class="fas fa-caret-right"></i> ${aisle}</li></ul>`).append(rows.join('')))
      })

      $(".aisle li.title").on("click", function() {
        $(this).parent().toggleClass("collapsed")
      })

      $(".aisle li.item").on('mouseup touchend', (e) => {
        clearTimeout(press_timeout)
      }).on('mousedown touchstart', function(){
        const el = $(this)
        press_timeout = setTimeout(() => {
          press_timedout = true
          const item = el.text()
          const aisle = el.attr("data-aisle")
          $('#input-edit').val(aisle)
          $('#editshade').show().find(".message").text(`Update the aisle for ${item}:`)
          $('#input-edit').focus().select()
          $("#btn-edit").on("click", function() {
            $.ajax({
              url: '/set_aisle/',
              method: 'post',
              data: {
                auth_key: auth_key,
                item: item,
                aisle: $('#input-edit').val(),
              },
              success: (data) => {
                $("#shopping").html("")
                initShopping()
                $('#editshade').hide()
              }
            })
          })
        }, 1000)
      })
      wire_remove()
    }
  })
}

let auth_key = "authfail"
let MODE = "default"

$(document).ready(() => {
  let params = new URLSearchParams(window.location.search.slice(1))
  auth_key = params.get("password")
  if(!auth_key){
    auth_key = localStorage ? localStorage["password"] : null
  }
  if(!auth_key){
    auth_key = prompt("Password:")
  }

  refresh_items()
  setInterval(refresh_items, 60000)

  if(IS_PI){
    check_recipe()
    setInterval(check_recipe, 5000)
  }

  $('#input').on('keypress', (event) => {
    if ((event.keyCode ? event.keyCode : event.which) === 13){
      $('#submit').click();
      event.preventDefault();
    }
  }).on("input", event => {
    const value = $('#input').val().toLowerCase()
    display_frequent_with_filter(value)
  })

  $('#submit').on(CLICK_EVENT, () => {
    add_item($('#input').val())
  })

  const add_letter = (char) => {
    const event = $.Event("keypress")
    event.which = char.charCodeAt(0)
    event.keyCode = char.charCodeAt(0)
    $('#input').val($('#input').val() + char)
	  $('#input').trigger(event)
    $('#input').trigger($.Event("input"))
  }

  $('#keyboard .letter').on(CLICK_EVENT, function(){
    let char
    if ($(this).children().length){
      char = $(this).children(":visible").text()
    }else{
      char = $(this).text()
    }
    add_letter(char)
  })

  $('#keyboard .space').on(CLICK_EVENT, function(){
    add_letter(" ")
  })

  $('#keyboard .return').on(CLICK_EVENT, function(){
    $('#submit').click();
  })

  $('#keyboard .hide').on(CLICK_EVENT, function(){
    $('#keyboard').animate({
      "bottom": $('#keyboard').innerHeight() * -1
    }, () => {
      $('#show-keyboard').show()
      reflow_list()
    });
  })

  $('#keyboard .delete').on(CLICK_EVENT, function(){
    const val = $('#input').val()
    $('#input').val(val.substr(0, val.length - 1))
    $('#input').trigger($.Event("input"))
  })

  $('#keyboard .refresh').on(CLICK_EVENT, function(){
    location.reload()
  })

  $('#keyboard .clear').on(CLICK_EVENT, function(){
    if(confirm("Clear all items?")){
      $.ajax({
          url: '/clear_items/',
          method: 'post',
          data: {
            auth_key: auth_key
          },
          success: (data) => {
            $('#list .item').remove()
            $('#frequent .item').removeClass("hidden")
          }
      })
    }
  })

  $('#show-keyboard').on(CLICK_EVENT, function(){
    $(this).hide()
    $('#keyboard').animate({
      "bottom": 0
    }, reflow_list)
  })

  $('#shopping-mode').on("click", function(){
    if(MODE == "default") {
      MODE = "shopping"
      $(this).find("i").removeClass("fa-shopping-cart").addClass("fa-check")
      $('#top').hide()
      $('#listwrapper').css({"margin-top": 0})
      $("#list").hide()
      $("#shopping").html("").show()
      initShopping()
    } else {
      MODE = "default"
      $(this).find("i").removeClass("fa-check").addClass("fa-shopping-cart")
      $('#top').show()
      $('#listwrapper').css({"margin-top": '145px'})
      $("#list").show()
      $("#shopping").hide()
    }
    reflow_list()
  })

  $('#editshade').on('click', function(){
    $(this).hide();
  }).children().on('click', function(e){
    e.stopPropagation()
  })

  if(IS_PI){
    $('#show-keyboard').click()
    $("#banner").show()
    $('#shopping-mode').hide()
  } else {
    $('#show-keyboard').hide()
  }

})
