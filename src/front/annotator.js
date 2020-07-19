Vue.component('annotator', {
  data: function () {
    return {
      show: false
    }
  },
  props: {
    currentProject: null
  },
  methods: {
    save : function(){
        var _via_project = { '_via_settings': _via_settings,
                       '_via_img_metadata': _via_img_metadata,
                       '_via_attributes': _via_attributes };
        console.log(_via_project);
        axios.post("/api/projects/"+this.$props.currentProject,JSON.stringify(_via_project)).then(response => {
            console.log(response);
	    });

    },
    reload: function(project) {
        try {
            _via_current_image_loaded = false;
            if(this.show) {
                _via_display_area = document.getElementById('display_area');
                _via_img_panel = document.getElementById('image_panel');
                _via_reg_canvas = document.getElementById('region_canvas');
                _via_annotaion_editor_panel = document.getElementById('annotation_editor_panel');
                image_grid_panel = document.getElementById('image_grid_panel');

                // UI html elements
                invisible_file_input = document.getElementById("invisible_file_input");
                display_area = document.getElementById("display_area");
                image_panel = document.getElementById("image_panel");
                img_buffer_now = document.getElementById("img_buffer_now");

                annotation_list_snippet = document.getElementById("annotation_list_snippet");
                annotation_textarea = document.getElementById("annotation_textarea");

                img_fn_list_panel = document.getElementById('img_fn_list_panel');
                img_fn_list = document.getElementById('img_fn_list');
                attributes_panel = document.getElementById('attributes_panel');
                leftsidebar = document.getElementById('leftsidebar');

                _via_init();
                axios.get("/api/projects/"+project).then(response => {
                    console.log(response);
                    project_open_parse_json_file(response.data);
                });
            }

        }
        catch(error)
        {
            //TODO: fix the error instead try/catch :)
            console.log(error);
        }
    }
  },
  updated: function () {
    this.reload(this.currentProject);
  },
  template: `
  <main class="mdl-layout__content mdl-color--grey-100" onload="_via_init()" onresize="_via_update_ui_components()" v-if="show">
        


  <div class="mdl-grid demo-content">
  
  <div class="demo-graphs mdl-shadow--2dp mdl-color--white mdl-cell mdl-cell--8-col">
 
        <!-- Main display area: contains image canvas, ... -->
        <div id="display_area">
            <div id="image_panel" class="display_area_content display_none">
                <!-- buffer images using <img> element will be added here -->

                <!-- @todo: in future versions, this canvas will be replaced by a <svg> element -->
                <canvas id="region_canvas" width="1" height="1" tabindex="1">Sorry, your browser does not support HTML5
                    Canvas functionality which is required for this application.</canvas>
                <!-- here, a child div with id="annotation_editor" is added by javascript -->
            </div>
            <div id="image_grid_panel" class="display_area_content display_none">

                <div id="image_grid_group_panel">
                    <span class="tool">Group by&nbsp; <select id="image_grid_toolbar_group_by_select"
                            onchange="image_grid_toolbar_onchange_group_by_select(this)"></select></span>
                </div>

                <div id="image_grid_toolbar">
                    <span>Selected</span>
                    <span id="image_grid_group_by_sel_img_count">0</span>
                    <span>of</span>
                    <span id="image_grid_group_by_img_count">0</span>
                    <span>images in current group, show</span>

                    <span>
                        <select id="image_grid_show_image_policy" onchange="image_grid_onchange_show_image_policy(this)">
                            <option value="all">all images (paginated)</option>
                            <option value="first_mid_last">only first, middle and last image</option>
                            <option value="even_indexed">even indexed images (i.e. 0,2,4,...)</option>
                            <option value="odd_indexed">odd indexed images (i.e. 1,3,5,...)</option>
                            <option value="gap5">images 1, 5, 10, 15,...</option>
                            <option value="gap25">images 1, 25, 50, 75, ...</option>
                            <option value="gap50">images 1, 50, 100, 150, ...</option>
                        </select>
                    </span>

                    <div id="image_grid_nav"></div>
                </div>

                <div id="image_grid_content">
                    <div id="image_grid_content_img"></div>
                    <svg xmlns:xlink="http://www.w3.org/2000/svg" id="image_grid_content_rshape"></svg>
                </div>

                <div id="image_grid_info">
                </div>
            </div> <!-- end of image grid panel -->

            <div id="settings_panel" class="display_area_content display_none">
                <h2>Settings</h2>
                <div class="row">
                    <div class="variable">
                        <div class="name">Project Name</div>
                    </div>

                    <div class="value">
                        <input type="text" id="_via_settings.project.name" />
                    </div>
                </div>

                <div class="row">
                    <div class="variable">
                        <div class="name">Default Path</div>
                        <div class="desc">If all images in your project are saved in a single folder, set the default path
                            to the location of this folder. The VIA application will load images from this folder by
                            default. Note: a default path of <code>"./"</code> indicates that the folder containing
                            <code>via.html</code> application file also contains the images in this project. For example:
                            <code>/datasets/VOC2012/JPEGImages/</code> or <code>C:\Documents\data\</code>&nbsp;<strong>(note
                                the trailing <code>/</code> and <code>\</code></strong>)</div>
                    </div>
                            
                    <div class="value">
                        <input type="text" id="_via_settings.core.default_filepath"
                            placeholder="/datasets/pascal/voc2012/VOCdevkit/VOC2012/JPEGImages/" />
                    </div>
                </div>
                            
                <div class="row">
                    <div class="variable">
                        <div class="name">Search Path List</div>
                        <div class="desc">If you define multiple paths, all these folders will be searched to find images in
                            this project. We do not recommend this approach as it is computationally expensive to search for
                            images in multiple folders. <ol id="_via_settings.core.filepath"></ol>
                        </div>
                    </div>
                            
                    <div class="value">
                        <input type="text" id="settings_input_new_filepath"
                            placeholder="/datasets/pascal/voc2012/VOCdevkit/VOC2012/JPEGImages" />
                    </div>
                </div>
                            
                <div class="row">
                    <div class="variable">
                        <div class="name">Region Label</div>
                        <div class="desc">By default, each region in an image is labelled using the region-id. Here, you can
                            select a more descriptive labelling of regions.</div>
                    </div>
                            
                    <div class="value">
                        <select id="_via_settings.ui.image.region_label"></select>
                    </div>
                </div>
                            
                <div class="row">
                    <div class="variable">
                        <div class="name">Region Colour</div>
                        <div class="desc">By default, each region is drawn using a single colour. Using this setting, you
                            can assign a unique colour to regions grouped according to a region attribute.</div>
                    </div>
                            
                    <div class="value">
                        <select id="_via_settings.ui.image.region_color"></select>
                    </div>
                </div>
                            
                <div class="row">
                    <div class="variable">
                        <div class="name">Region Label Font</div>
                        <div class="desc">Font size and font family for showing region labels.</div>
                    </div>
                            
                    <div class="value">
                        <input id="_via_settings.ui.image.region_label_font" placeholder="12px Arial" />
                    </div>
                </div>
                            
                <div class="row">
                    <div class="variable">
                        <div class="name">Preload Buffer Size</div>
                        <div class="desc">Images are preloaded in buffer to allow smoother navigation of next/prev images. A
                            large buffer size may slow down the overall browser performance. To disable preloading, set
                            buffer size to 0.</div>
                    </div>
                    <div class="value">
                        <input type="text" id="_via_settings.core.buffer_size" />
                    </div>
                </div>
                            
                <div class="row">
                    <div class="variable">
                        <div class="name">On-image Annotation Editor</div>
                        <div class="desc">When a single region is selected, the on-image annotation editor is gets activated
                            which the user to update annotations of this region. By default, this on-image annotation editor
                            is placed near the selected region.</div>
                    </div>
                            
                    <div class="value">
                        <select id="_via_settings.ui.image.on_image_annotation_editor_placement">
                            <option value="NEAR_REGION">close to selected region</option>
                            <option value="IMAGE_BOTTOM">at the bottom of image being annotated</option>
                            <option value="DISABLE">DISABLE on-image annotation editor</option>
                        </select>
                    </div>
                </div>
                            
                <div class="row" style="border:none;">
                    <button onclick="settings_save()" value="save_settings" style="margin-top:2rem">Save</button>
                    <button onclick="settings_panel_toggle()" value="cancel_settings"
                        style="margin-left:2rem;">Cancel</button>
                </div>
            </div> <!-- end of settings panel -->
                            
            <div id="page_404" class="display_area_content display_none narrow_page_content">
                <h2>File Not Found</h2>
                <p>Filename: <span style="font-family:Mono;" id="page_404_filename"></span></p>
                            
                <p>We recommend that you update the default path in <span class="text_button" title="Show Project Settings"
                        onclick="settings_panel_toggle()">project settings</span> to the folder which contains this image.
                </p>
                            
                <p>A temporary fix is to use <span class="text_button" title="Load or Add Images"
                        onclick="sel_local_images()">browser's file selector</span> to manually locate and add this file. We
                    do not recommend this approach because it requires you to repeat this process every time your load this
                    project in the VIA application.</p>
            </div> <!-- end of file not found panel -->
                            
            <div id="page_start_info" class="display_area_content display_none narrow_page_content">
                <ul>
                    <li>To start annotation, <span class="text_button" title="Load or Add Images"
                            onclick="sel_local_images()">select images</span> (or, add images from <span class="text_button"
                            title="Add images from a web URL (e.g. http://www.robots.ox.ac.uk/~vgg/software/via/images/swan.jpg)"
                            onclick="project_file_add_url_with_input()">URL</span> or <span class="text_button"
                            title="Add images using absolute path of file (e.g. /home/abhishek/image1.jpg)"
                            onclick="project_file_add_abs_path_with_input()">absolute path</span>) and draw regions</li>
                    <li>Use <span class="text_button" title="Toggle attributes editor panel"
                            onclick="toggle_attributes_editor()">attribute editor</span> to define attributes (e.g. name)
                        and <span class="text_button" title="Toggle annotations editor panel"
                            onclick="annotation_editor_toggle_all_regions_editor()">annotation editor</span> to describe
                        each region (e.g. cat) using these attributes.</li>
                    <li>Remember to <span class="text_button" onclick="project_save_with_confirm()">save</span> your project
                        before closing this application so that you can <span class="text_button"
                            onclick="project_open_select_project_file()">load</span> it later to continue annotation.</li>
                    <li>For help, see the <span class="text_button"
                            onclick="set_display_area_content(VIA_DISPLAY_AREA_CONTENT_NAME.PAGE_GETTING_STARTED)">Getting
                            Started</span> page and pre-loaded demo: <a
                            href="http://www.robots.ox.ac.uk/~vgg/software/via/via_demo.html">image annotation</a> and <a
                            href="http://www.robots.ox.ac.uk/~vgg/software/via/via_face_demo.html">face annotation</a>.</li>
                </ul>
                            
            </div>
                            
            <div id="page_getting_started" class="display_area_content display_none narrow_page_content">
                <p>A more detailed user guide (with screenshots and descriptions) is <a
                        href="http://www.robots.ox.ac.uk/~vgg/software/via/docs/user_guide.html">available here</a>.</p>
                <ol>
                    <li><strong>Load Images</strong>: The first step is to load all the images that you wish to annotate.
                        There are multiple ways to add images to a VIA project. Choose the method that suits your use case.
                        <ul>
                            <li>Method 1: Selecting local files using browser's file selector
                                <ol>
                                    <li>Click <span class="text_button" title="Load or Add Images"
                                            onclick="sel_local_images()"><code>Project &rarr; Add local files</code></span>
                                    </li>
                                    <li>Select desired images and click <code>Open</code></li>
                                </ol>
                            </li>
                            <li>Method 2: Adding files from URL or absolute path
                                <ol>
                                    <li>Click <span class="text_button"
                                            title="Add images from a web URL (e.g. http://www.robots.ox.ac.uk/~vgg/software/via/images/swan.jpg)"
                                            onclick="project_file_add_url_with_input()"><code>Project &rarr; Add files from URL</code></span>
                                    </li>
                                    <li>Enter URL and click <code>OK</code></li>
                                </ol>
                            </li>
                            <li>Method 3: Adding files from list of url or absolute path stored in text file
                                <ol>
                                    <li>Create a text file containing URL and absolute path (one per line)</li>
                                    <li>Click <span class="text_button"
                                            title="Add images from a list of web url or absolute path stored in a text file (one url or path per line)"
                                            onclick="sel_local_data_file('files_url')"><code>Project &rarr; Add url or path from text file</code></span>
                                    </li>
                                    <li>Select the text file and click <code>Open</code></li>
                                </ol>
                            </li>
                        </ul>
                    </li>
                    <li><strong>Draw Regions</strong>: Select a region shape (<span class="text_button"
                            onclick="select_region_shape('rect')">rectangle</span>, <span class="text_button"
                            onclick="select_region_shape('circle')">circle</span>, <span class="text_button"
                            onclick="select_region_shape('ellipse')">ellipse</span>, <span class="text_button"
                            onclick="select_region_shape('polygon')">polygon</span>, <span class="text_button"
                            onclick="select_region_shape('point')">point</span>, <span class="text_button"
                            onclick="select_region_shape('polyline')">polyline</span>) from the left sidebar and draw
                        regions as follows:
                            
                        <ul>
                            <li>Rectangle, Circle and Ellipse
                                <ul>
                                    <li>Press left mouse button, drag mouse cursor and release mouse button.</li>
                                    <li>To define a point inside an existing region, click inside the region to select it
                                        (if not already selected), now press left mouse button, drag and release to draw
                                        region inside existing region.</li>
                                    <li>To select, click inside the region. If the click point contains multiple regions,
                                        then clicking multiple times at that location shuffles selection through those
                                        regions.</li>
                                </ul>
                            </li>
                        </ul>
                            
                        <ul>
                            <li>Point
                                <ul>
                                    <li>Click to define points.</li>
                                    <li>To draw a region inside existing region, click inside the region to select it (if
                                        not already selected), now click again to define the point.</li>
                                    <li>To select, click on (or near) the existing point.</li>
                                </ul>
                            </li>
                        </ul>
                                    
                        <ul>
                            <li>Polygon and Polyline
                                <ul>
                                    <li>Click to define vertices.</li>
                                    <li>Press <strong>[Enter]</strong> to finish drawing the region or press [Esc] to
                                        cancel.</li>
                                    <li>If the first vertex needs to be defined inside an existing region, click inside the
                                        region to select it (if not already selected), now click again to define the vertex.
                                    </li>
                                    <li>To select, click inside the region. If the click point contains multiple regions,
                                        then clicking multiple times at that location shuffles selection through those
                                        regions.</li>
                                </ul>
                            </li>
                        </ul>
                    </li>
                                    
                    <li><strong>Create Annotations</strong>: For a more detailed description of this step, see <a
                            href="http://www.robots.ox.ac.uk/~vgg/software/via/docs/creating_annotations.html">Creating
                            Annotations : VIA User Guide</a>. Click the <span class="text_button"
                            onclick="annotation_editor_toggle_all_regions_editor()"><code>View &rarr; Toggle attributes editor</code></span>
                        to show attributes editor panel in left sidebar and add the desired file or region attributes (e.g.
                        name). Now click <span class="text_button"
                            onclick="annotation_editor_toggle_all_regions_editor()"><code>View &rarr; Toggle annotations editor</code></span>
                        to show the annotation editor panel in the bottom side. Update the annotations for each region.</li>
                    <li><strong>Export Annotations</strong>: To export the annotations in json or csv format, click <span
                            class="text_button"
                            onclick="download_all_region_data('csv')"><code>Annotation &rarr; Export annotations</code></span>
                        in top menubar.</li>
                    <li><strong>Save Project</strong>: To save the project, click <span class="text_button"
                            onclick="project_save_with_confirm()"><code>Project &rarr; Save</code></span> in top menubar.
                    </li>
                </ol>
            </div>
                        
            <div id="page_load_ongoing" class="display_area_content narrow_page_content">
                <div style="text-align:center">
                    <a href="http://www.robots.ox.ac.uk/~vgg/software/via/">
                        <svg height="160" viewbox="0 0 400 160" style="background-color:#212121;">
                            <use xlink:href="#via_logo"></use>
                        </svg>
                    </a>
                    <div style="margin-top:4rem">Loading ...</div>
                </div>
            </div>
                        
        </div> <!-- end of display_area -->



  </div>


  <div class="demo-cards mdl-cell mdl-cell--4-col mdl-cell--8-col-tablet mdl-grid mdl-grid--no-spacing">




      <!-- REGION SHAPE -->
      <div class="demo-updates mdl-card mdl-shadow--2dp mdl-cell mdl-cell--4-col mdl-cell--4-col-tablet mdl-cell--12-col-desktop">
          <button class="leftsidebar_accordion active">Region Shape</button>
              <div class="leftsidebar_accordion_panel show">
                  <ul class="region_shape">
                      <li id="region_shape_rect" class="selected clickable" onclick="select_region_shape('rect')"
                          title="Rectangle (Shortcut key 1)">
                            <button class="mdl-button mdl-js-button mdl-button--icon">                
                                <svg height="32" viewbox="0 0 32 32"><use xlink:href="#shape_rectangle"></use></svg>
                            </button></li>
                      <li id="region_shape_circle" class="clickable" onclick="select_region_shape('circle')" title="Circle (Shortcut key 2)">
                            <button class="mdl-button mdl-js-button mdl-button--icon">                
                                <svg height="32" viewbox="0 0 32 32"><use xlink:href="#shape_circle"></use></svg>
                            </button></li>
                      <li id="region_shape_ellipse" onclick="select_region_shape('ellipse')" title="Ellipse (Shortcut key 3)">
                            <button class="mdl-button mdl-js-button mdl-button--icon">                
                                <svg height="32" viewbox="0 0 32 32"><use xlink:href="#shape_ellipse"></use></svg>
                            </button></li>
                      <li id="region_shape_polygon" onclick="select_region_shape('polygon')" title="Polygon (Shortcut key 4)">
                            <button class="mdl-button mdl-js-button mdl-button--icon">                
                                <svg height="32" viewbox="0 0 32 32"><use xlink:href="#shape_polygon"></use></svg>
                            </button></li>
                      <li id="region_shape_point" onclick="select_region_shape('point')" title="Point (Shortcut key 5)">
                            <button class="mdl-button mdl-js-button mdl-button--icon">                
                                <svg height="32" viewbox="0 0 32 32"><use xlink:href="#shape_point"></use></svg>
                            </button></li>
                      <li id="region_shape_polyline" onclick="select_region_shape('polyline')" title="Polyline (Shortcut key 6)">
                            <button class="mdl-button mdl-js-button mdl-button--icon">                
                                <svg height="32" viewbox="0 0 32 32"><use xlink:href="#shape_polyline"></use></svg>
                            </button></li>
                  </ul>
                  <div id="region_info" class="display_none">&nbsp;</div>
              </div>
      </div>
                              
      <div class="demo-separator mdl-cell--1-col"></div>

      <!-- MAIN MENU -->
      <div class="demo-updates mdl-card mdl-shadow--2dp mdl-cell mdl-cell--4-col mdl-cell--4-col-tablet mdl-cell--12-col-desktop">
        <!-- Attributes -->
        <button class="leftsidebar_accordion active" id="attributes_editor_panel_title">Main options</button>
        <div class="leftsidebar_accordion_panel show" id="attributes_editor_panel">
            <ul>
                <li class="clickable" onclick="project_open_select_project_file()">
                    <button class="mdl-button mdl-js-button mdl-button--icon">                
                        <i class="material-icons">folder_open</i>
                    </button>load project
                </li>
                <li class="clickable" v-on:click="save"> 
                <!--onclick="project_save_with_confirm()">-->
                    <button class="mdl-button mdl-js-button mdl-button--icon">                
                        <i class="material-icons">save</i>
                    </button>save
                </li>

                <li class="clickable" onclick="download_all_region_data('csv')">
                    <button class="mdl-button mdl-js-button mdl-button--icon">                
                        <i class="material-icons">archive</i>
                    </button>export annotations (as csv)
                </li>
                <li class="clickable" onclick="download_all_region_data('json')">
                    <button class="mdl-button mdl-js-button mdl-button--icon">                
                        <i class="material-icons">archive</i>
                    </button>export annotations (as json)
                </li>
                <li class="clickable" onclick="download_all_region_data('coco', 'json')">
                    <button class="mdl-button mdl-js-button mdl-button--icon">                
                        <i class="material-icons">archive</i>
                    </button>export annotations (as COCO)
                </li>

                <li class="clickable" onclick="project_file_add_url_with_input()">
                    <button class="mdl-button mdl-js-button mdl-button--icon">                
                        <i class="material-icons">add_to_photos</i>
                    </button>add files from URL
                </li>
                <li class="clickable" onclick="project_file_remove_with_confirm()">
                    <button class="mdl-button mdl-js-button mdl-button--icon">                
                        <i class="material-icons">delete</i>
                    </button>remove file
                </li>


                <li class="clickable" onclick="image_grid_toggle()">
                    <button class="mdl-button mdl-js-button mdl-button--icon">                
                        <i class="material-icons">grid_on</i> 
                    </button>grid view
                </li>
                <li class="clickable" onclick="annotation_editor_toggle_all_regions_editor()">
                    <button class="mdl-button mdl-js-button mdl-button--icon">                
                        <i class="material-icons">description</i> 
                    </button>toggle annotation editor
                </li>
                <li class="clickable" onclick="move_to_prev_image()">
                    <button class="mdl-button mdl-js-button mdl-button--icon" >
                        <i class="material-icons">navigate_before</i> 
                    </button>previous
                </li>
                <li class="clickable" onclick="move_to_next_image()">
                    <button class="mdl-button mdl-js-button mdl-button--icon">
                        <i class="material-icons">navigate_next</i> 
                    </button>next
                </li>
                <li class="clickable" onclick="zoom_in()">
                    <button class="mdl-button mdl-js-button mdl-button--icon">
                        <i class="material-icons">zoom_in</i> 
                    </button>zoom in
                </li>
                <li class="clickable" onclick="zoom_out()">
                    <button class="mdl-button mdl-js-button mdl-button--icon">
                        <i class="material-icons">zoom_out</i> 
                    </button>zoom out
                </li>
                <li class="clickable" onclick="sel_all_regions()">
                    <button class="mdl-button mdl-js-button mdl-button--icon">
                        <i class="material-icons">select_all</i>
                    </button>select all regions
                </li>
                <li class="clickable" onclick="copy_sel_regions()">
                    <button class="mdl-button mdl-js-button mdl-button--icon">
                        <i class="material-icons">file_copy</i>
                    </button>copy regions
                </li>
                <li class="clickable" onclick="paste_sel_regions_in_current_image()">
                    <button class="mdl-button mdl-js-button mdl-button--icon">
                        <i class="material-icons">post_add</i>
                    </button>paste regions
                </li>
                <li class="clickable" onclick="del_sel_regions()">
                    <button class="mdl-button mdl-js-button mdl-button--icon">
                        <i class="material-icons">delete_forever</i>
                    </button>delete region
                </li>
                
            </ul>
        </div>
      </div>

      <div class="demo-separator mdl-cell--1-col"></div>

      <!-- ATTRIBUTES -->
      <div class="demo-updates mdl-card mdl-shadow--2dp mdl-cell mdl-cell--4-col mdl-cell--4-col-tablet mdl-cell--12-col-desktop">
        <!-- Attributes -->
        <button class="leftsidebar_accordion active" id="attributes_editor_panel_title">Attributes</button>
        <div class="leftsidebar_accordion_panel show" id="attributes_editor_panel">
            <div class="button_panel" style="padding:1rem 0;">
                <span class="text_button" onclick="show_region_attributes_update_panel()"
                    id="button_show_region_attributes" title="Show region attributes">Region Attributes</span>
                <span class="text_button" onclick="show_file_attributes_update_panel()" id="button_show_file_attributes"
                    title="Show file attributes">File Attributes</span>
            </div>
            <div id="attributes_update_panel">
                <div class="button_panel">
                    <input style="width:70%" type="text" placeholder="attribute name" id="user_input_attribute_id"
                        value="">
                    <span id="button_add_new_attribute" class="button" onclick="add_new_attribute_from_user_input()"
                        title="Add new attribute">&plus;</span>
                    <span id="button_del_attribute" class="button" onclick="delete_existing_attribute_with_confirm()"
                        title="Delete existing attribute">&minus;</span>
                </div>
                <div class="button_panel" style="margin:0.1rem 0;">
                    <select style="width:100%" id="attributes_name_list" onchange="update_current_attribute_id(this)"
                        title="List of existing attributes"></select>
                </div>
                <div id="attribute_properties"></div>
                <div id="attribute_options"></div>
                <p style="text-align:center">
                    <span class="text_button" title="Show a spreadsheet like editor for all manual annotations"
                        onclick="annotation_editor_toggle_all_regions_editor()">Toggle Annotation Editor</span>
                </p>
            </div>
        </div>
      </div>

      <div class="demo-separator mdl-cell--1-col"></div>


      <!-- PROJECT -->
      <div class="demo-updates mdl-card mdl-shadow--2dp mdl-cell mdl-cell--4-col mdl-cell--4-col-tablet mdl-cell--12-col-desktop">
        <!-- Project -->
        <button class="leftsidebar_accordion active" id="project_panel_title">Project</button>
        <div class="leftsidebar_accordion_panel show" id="img_fn_list_panel">
            <div id="project_info_panel">
                <div class="row">
                    <span class="col"><label for="project_name">Name: </label></span>
                    <span class="col"><input type="text" value="" onchange="project_on_name_update(this)"
                            id="project_name" title="VIA project name"></span>
                </div>
            </div>
            <div id="project_tools_panel">
                <div class="button_panel" style="margin:0.1rem 0;">
                    <select style="width:48%" id="filelist_preset_filters_list"
                        onchange="img_fn_list_onpresetfilter_select()"
                        title="Filter file list using predefined filters">
                        <option value="all">All files</option>
                        <option value="files_without_region">Show files without regions</option>
                        <option value="files_missing_region_annotations">Show files missing region annotations</option>
                        <option value="files_missing_file_annotations">Show files missing file annotations</option>
                        <option value="files_error_loading">Files that could not be loaded</option>
                        <option value="regex">Regular Expression</option>
                    </select>
                    <input style="width:50%" type="text" placeholder="regular expression"
                        oninput="img_fn_list_onregex()" id="img_fn_list_regex" title="Filter using regular expression">
                </div>
            </div>
            <div id="img_fn_list"></div>
            <p>
                <div class="button_panel">
                    <span class="button" onclick="sel_local_images()" title="Add new file from local disk">Add
                        Files</span>
                    <span class="button" onclick="project_file_add_url_with_input()" title="Add new file using URL">Add
                        URL</span>
                    <span class="button" onclick="project_file_remove_with_confirm()"
                        title="Remove selected file (i.e. file currently being shown) from project">Remove</span>
                </div>
            </p>
        </div>
      </div>

      <div class="demo-separator mdl-cell--1-col"></div>


      <!-- SHORTCUTS -->
      <div class="demo-updates mdl-card mdl-shadow--2dp mdl-cell mdl-cell--4-col mdl-cell--4-col-tablet mdl-cell--12-col-desktop">
          <button class="leftsidebar_accordion active">Keyboard Shortcuts</button>
          <div class="leftsidebar_accordion_panel show">
              <div style="display:block; text-align:center; padding:1rem;">Available only on image focus</div>
              <table>
                  <tr>
                      <td style="width:8em;"><span class="key">&larr;</span>&nbsp;<span
                              class="key">&uarr;</span>&nbsp;<span class="key">&rarr;</span>&nbsp;<span
                              class="key">&darr;</span></td>
                      <td>Move selected region by 1 px (Shift to jump)</td>
                  </tr>
                  <tr>
                      <td><span class="key">a</span></td>
                      <td>Select all regions</td>
                  </tr>

                  <tr>
                      <td><span class="key">c</span></td>
                      <td>Copy selected regions</td>
                  </tr>
                  <tr>
                      <td><span class="key">v</span></td>
                      <td>Paste selected regions</td>
                  </tr>
                  <tr>
                      <td><span class="key">d</span></td>
                      <td>Delete selected regions</td>
                  </tr>
                  <tr>
                      <td><span class="key">Ctrl</span> + Wheel</td>
                      <td>Zoom in/out (mouse cursor is over image)</td>
                  </tr>
                  <tr>
                      <td><span class="key">l</span></td>
                      <td>Toggle region label</td>
                  </tr>
                  <tr>
                      <td><span class="key">b</span></td>
                      <td>Toggle region boundary</td>
                  </tr>
                  <tr>
                      <td><span class="key">Enter</span></td>
                      <td>Finish drawing polyshape</td>
                  </tr>
                  <tr>
                      <td><span class="key">Backspace</span></td>
                      <td>Delete last polyshape vertex</td>
                  </tr>
              </table>

              <div style="display:block; text-align:center; padding:1rem;">Always Available</div>
              <table>
                  <tr>
                      <td style="width:8em;"><span class="key">&larr;</span>&nbsp;<span class="key">&rarr;</span></td>
                      <td>Move to next/previous image</td>
                  </tr>
                  <tr>
                      <td><span class="key">+</span>&nbsp;<span class="key">-</span>&nbsp;<span class="key">=</span></td>
                      <td>Zoom in/out/reset</td>
                  </tr>
                  <tr>
                      <td><span class="key">&uarr;</span></td>
                      <td>Update region label</td>
                  </tr>
                  <tr>
                      <td><span class="key">&darr;</span></td>
                      <td>Update region colour</td>
                  </tr>
                  <tr>
                      <td><span class="key">Spacebar</span></td>
                      <td>Toggle annotation editor (Ctrl to toggle on image editor)</td>
                  </tr>
                  <tr>
                      <td><span class="key">Home</span> / <span class="key">h</span></td>
                      <td>Jump to first image</td>
                  </tr>
                  <tr>
                      <td><span class="key">End</span> / <span class="key">e</span></td>
                      <td>Jump to last image</td>
                  </tr>
                  <tr>
                      <td><span class="key">PgUp</span> / <span class="key">u</span></td>
                      <td>Jump several images</td>
                  </tr>
                  <tr>
                      <td><span class="key">PgDown</span> / <span class="key">d</span></td>
                      <td>Jump several images</td>
                  </tr>

                  <tr>
                      <td><span class="key">Esc</span></td>
                      <td>Cancel ongoing task</td>
                  </tr>
              </table>
          </div>
      </div>

      <div class="demo-separator mdl-cell--1-col"></div>

  </div>

  <div class="demo-charts mdl-color--white mdl-shadow--2dp mdl-cell mdl-cell--12-col mdl-grid">
    <!-- spreadsheet like editor for annotations -->
    <div id="annotation_editor_panel">
      <div class="button_panel">
          <span class="text_button" onclick="edit_region_metadata_in_annotation_editor()" id="button_edit_region_metadata"
              title="Manual annotations of regions">Region Annotations</span>
          <span class="text_button" onclick="edit_file_metadata_in_annotation_editor()" id="button_edit_file_metadata"
              title="Manual annotations of a file">File Annotations</span>
                            
          <span class="button" style="float:right;margin-right:0.2rem;"
              onclick="annotation_editor_toggle_all_regions_editor()"
              title="Close this window of annotation editor">&times;</span>
          <span class="button" style="float:right;margin-right:0.2rem;"
              onclick="annotation_editor_increase_panel_height()" title="Increase the height of this panel">&uarr;</span>
          <span class="button" style="float:right;margin-right:0.2rem;"
              onclick="annotation_editor_decrease_panel_height()" title="Decrease the height of this panel">&darr;</span>
          <span class="button" style="float:right;margin-right:0.2rem;"
              onclick="annotation_editor_increase_content_size()"
              title="Increase size of contents in annotation editor">&plus;</span>
          <span class="button" style="float:right;margin-right:0.2rem;"
              onclick="annotation_editor_decrease_content_size()"
              title="Decrease size of contents in annotation editor">&minus;</span>
      </div>
      <!-- here, a child div with id="annotation_editor" is added by javascript -->
    </div>
  </div>
</div>


  <svg style="display:none;" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
      <symbol id="via_logo">
          <!-- Logo designed by Abhishek Dutta <adutta@robots.ox.ac.uk>, May 2018 -->
          <title>VGG Image Annotator Logo</title>
          <rect width="400" height="160" x="0" y="0" fill="#212121"></rect>

          <text x="56" y="130" font-family="Serif" font-size="100" fill="white">V</text>
          <text x="180" y="130" font-family="Serif" font-size="100" fill="white">I</text>
          <text x="270" y="130" font-family="Serif" font-size="100" fill="white">A</text>

          <rect width="80" height="100" x="52" y="40" stroke="yellow" fill="none" stroke-width="2"></rect>
          <text x="72" y="30" font-family="'Comic Sans MS', cursive, sans-serif" font-size="18"
              fill="yellow">VGG</text>

          <rect width="50" height="100" x="175" y="45" stroke="yellow" fill="none" stroke-width="2"></rect>
          <text x="175" y="35" font-family="'Comic Sans MS', cursive, sans-serif" font-size="18"
              fill="yellow">Image</text>

          <rect width="80" height="100" x="265" y="40" stroke="yellow" fill="none" stroke-width="2"></rect>
          <text x="265" y="30" font-family="'Comic Sans MS', cursive, sans-serif" font-size="18"
              fill="yellow">Annotator</text>
      </symbol>
      <symbol id="shape_rectangle">
          <title>Rectangular region shape</title>
          <rect width="20" height="12" x="6" y="10" stroke-width="2"></rect>
      </symbol>
      <symbol id="shape_circle">
          <title>Circular region shape</title>
          <circle r="10" cx="16" cy="16" stroke-width="2"></circle>
      </symbol>
      <symbol id="shape_ellipse">
          <title>Elliptical region shape</title>
          <ellipse rx="12" ry="8" cx="16" cy="16" stroke-width="2"></ellipse>
      </symbol>
      <symbol id="shape_polygon">
          <title>Polygon region shape</title>
          <path d="M 15.25,2.2372 3.625,11.6122 6,29.9872 l 20.75,-9.625 2.375,-14.75 z" stroke-width="2"></path>
      </symbol>
      <symbol id="shape_point">
          <title>Point region shape</title>
          <circle r="3" cx="16" cy="16" stroke-width="2"></circle>
      </symbol>
      <symbol id="shape_polyline">
          <title>Polyline region shape</title>
          <path d="M 2,12 10,24 18,12 24,18" stroke-width="2"></path>
          <circle r="1" cx="2" cy="12" stroke-width="2"></circle>
          <circle r="1" cx="10" cy="24" stroke-width="2"></circle>
          <circle r="1" cx="18" cy="12" stroke-width="2"></circle>
          <circle r="1" cx="24" cy="18" stroke-width="2"></circle>
      </symbol>

      <!-- Material icons downloaded from https://material.io/icons -->
      <symbol id="icon_settings">
          <path
              d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z">
          </path>
      </symbol>
      <symbol id="icon_save">
          <path
              d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z">
          </path>
      </symbol>
      <symbol id="icon_open">
          <path
              d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z">
          </path>
      </symbol>
      <symbol id="icon_gridon">
          <path
              d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 20H4v-4h4v4zm0-6H4v-4h4v4zm0-6H4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4z">
          </path>
      </symbol>
      <symbol id="icon_gridoff">
          <path
              d="M8 4v1.45l2 2V4h4v4h-3.45l2 2H14v1.45l2 2V10h4v4h-3.45l2 2H20v1.45l2 2V4c0-1.1-.9-2-2-2H4.55l2 2H8zm8 0h4v4h-4V4zM1.27 1.27L0 2.55l2 2V20c0 1.1.9 2 2 2h15.46l2 2 1.27-1.27L1.27 1.27zM10 12.55L11.45 14H10v-1.45zm-6-6L5.45 8H4V6.55zM8 20H4v-4h4v4zm0-6H4v-4h3.45l.55.55V14zm6 6h-4v-4h3.45l.55.54V20zm2 0v-1.46L17.46 20H16z">
          </path>
      </symbol>
      <symbol id="icon_next">
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
      </symbol>
      <symbol id="icon_prev">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path>
      </symbol>
      <symbol id="icon_list">
          <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"></path>
      </symbol>
      <symbol id="icon_zoomin">
          <path
              d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z">
          </path>
          <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z" />
      </symbol>
      <symbol id="icon_zoomout">
          <path
              d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z">
          </path>
      </symbol>
      <symbol id="icon_copy">
          <path
              d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z">
          </path>
      </symbol>
      <symbol id="icon_paste">
          <path
              d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z">
          </path>
      </symbol>
      <symbol id="icon_pasten">
          <path
              d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z">
          </path>
          <text x="8" y="18">n</text>
      </symbol>
      <symbol id="icon_pasteundo">
          <path
              d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z">
          </path>
          <text x="8" y="18">x</text>
      </symbol>
      <symbol id="icon_selectall">
          <path
              d="M3 5h2V3c-1.1 0-2 .9-2 2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2c0-1.1-.9-2-2-2zM5 21v-2H3c0 1.1.9 2 2 2zm-2-4h2v-2H3v2zM9 3H7v2h2V3zm2 18h2v-2h-2v2zm8-8h2v-2h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2zm0-12h2V7h-2v2zm0 8h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-16h2V3h-2v2zM7 17h10V7H7v10zm2-8h6v6H9V9z">
          </path>
      </symbol>
      <symbol id="icon_close">
          <path
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z">
          </path>
      </symbol>
      <symbol id="icon_insertcomment">
          <path
              d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z">
          </path>
      </symbol>
      <symbol id="icon_checkbox">
          <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z">
          </path>
      </symbol>
      <symbol id="icon_fileupload">
          <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"></path>
      </symbol>
      <symbol id="icon_filedownload">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path>
      </symbol>
  </defs>
</svg>

<!-- used by invoke_with_user_inputs() to gather user inputs -->
<div id="user_input_panel"></div>

<!-- to show status messages -->
<div id="message_panel">
  <div id="message_panel_content" class="content"></div>
</div>

<div class="top_panel" id="ui_top_panel">
  <input type="file" id="invisible_file_input" name="files[]" style="display:none">
</div> <!-- endof #top_panel -->

<!-- Middle Panel contains a left-sidebar and image display areas -->
<div class="middle_panel">
  <!-- this panel contains a button to shows the left side bar -->
  <div id="leftsidebar_collapse_panel">
      <span class="text_button" onclick="leftsidebar_toggle()" title="Show left sidebar">&rtrif;</span>
  </div>

  <div id="leftsidebar">
      

  </div> <!-- end of leftsidebar -->

  
</div> <!-- end of middle_panel -->

<!-- this vertical spacer is needed to allow scrollbar to show
   items like Keyboard Shortcut hidden under the attributes panel -->
<div style="width: 100%;" id="vertical_space"></div>

<!-- DEMO SCRIPT AUTOMATICALLY INSERTED BY VIA PACKER SCRIPT -->

    </main>
  `
});
