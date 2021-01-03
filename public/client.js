const IS_PI = navigator.userAgent.toLowerCase().indexOf("raspbian") >= 0

let frequent_items = []
let items = []

const wire_remove = () => {
  $('.remove').off().on('click', function(){
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
        el.slideUp('fast')
        items = items.filter(i => i.name !== name)
        reflow_list()
        $(`#frequent .item[data-name="${name}"]`).show()
      }
    })
  })
}

const wire_frequent = () => {
  $('#frequent .item').on('click', function() {
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
        console.log('reset frequ')
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

const check_recipe = () => {
  $.ajax({
    url: `/recipe/?auth_key=${auth_key}`,
    cache: false,
    method: 'GET'
  }).done((data) => {
    const response = JSON.parse(data)
    if (response.url !== 'None') {
      $.ajax({
        url: '/recipe/',
        method: 'POST',
        data: {
          url: 'unset',
          auth_key: auth_key
        }
      })
      const content = `
      <div class="recipe">
      <div class="closer">
      <button><i class="fa fa-times"></i></button>
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
      }
    }
    $('.closer button').on('click', () => {
      $('.recipe').remove()
    })
  })
}

const reflow_list = () => {
  $('#listwrapper').css({
    "height": $('#keyboard').offset().top - $('#listwrapper').offset().top
  })
}

let auth_key = "authfail"

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

  $('#submit').on('click', () => {
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

  $('#keyboard .letter').on('click', function(){
    let char
    if ($(this).children().length){
      char = $(this).children(":visible").text()
    }else{
      char = $(this).text()
    }
    add_letter(char)
  })

  $('#keyboard .space').on('click', function(){
    add_letter(" ")
  })

  $('#keyboard .return').on('click', function(){
    $('#submit').click();
  })

  $('#keyboard .hide').on('click', function(){
    $('#keyboard').animate({
      "bottom": $('#keyboard').innerHeight() * -1
    }, () => {
      $('#show-keyboard').show()
      reflow_list()
    });
  })

  $('#keyboard .delete').on('click', function(){
    const val = $('#input').val()
    $('#input').val(val.substr(0, val.length - 1))
    $('#input').trigger($.Event("input"))
  })

  $('#keyboard .refresh').on('click', function(){
    location.reload()
  })

  $('#keyboard .clear').on('click', function(){
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

  $('#show-keyboard').on("click", function(){
    $(this).hide()
    $('#keyboard').animate({
      "bottom": 0
    }, reflow_list)
  })

  if(IS_PI){
    $('#show-keyboard').click()
    $("#banner").show()
  }

})
