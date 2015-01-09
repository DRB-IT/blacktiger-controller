'use strict';

describe('Controller: ContactCtrl', function () {

    // load the controller's module
    beforeEach(module('blacktiger-templates'));
    beforeEach(module('blacktiger-controllers'));

    var ContactCtrl, scope, templateHtml, formElem, form;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope, $templateCache, $compile) {
        scope = $rootScope.$new();
        scope.context = {
            room: {
                contact: {
                    name: 'John Doe',
                    phoneNumber: '+4512345678',
                    email: 'example@mail.dk',
                    comment: 'I\'ll fix it'
                }
            }
        };
        
        ContactCtrl = $controller('ContactCtrl', {
            $scope: scope
        });
        
        templateHtml = $templateCache.get('views/settings-contact.html');
        formElem = angular.element('<div>' + templateHtml + '</div>');
        $compile(formElem)(scope);
        form = scope.contactForm;

        scope.$apply();
    }));

    it('should have submit button disabled when missing data', function () {
        expect(form.$valid).toBeFalsy();
    });
    
    it('should have submit button disabled when having invalid data', function () {
        form.name.$setViewValue('John D.');
        form.phoneNumber.$setViewValue('11223344');
        form.email.$setViewValue('NOP');
        
        expect(form.$valid).toBeFalsy();
    });
    
    it('should have submit button enabled when having valid data', function () {
        form.name.$setViewValue('John Doe');
        form.phoneNumber.$setViewValue('+4522334455');
        form.email.$setViewValue('john@mail.com');
        
        expect(form.$valid).toBeTruthy();
    });
});
