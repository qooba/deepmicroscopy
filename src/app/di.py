"""simple dependency injection container"""
import inspect
from typing import TypeVar

T = TypeVar('T')


class IScope:
    """scope interface"""

    def resolve(self, from_cls, key=''):
        """resolve"""
        raise NotImplementedError('resolve')

    def resolve_all(self, from_cls):
        """resolve all"""
        raise NotImplementedError('resolve_all')


class IContainer(IScope):
    """container interface"""

    def register_lambda(self, from_cls, to_lambda, key=''):
        """register lambda"""
        raise NotImplementedError('register_lambda')

    def register_instance(self, from_cls, instance, key=''):
        """register instance"""
        raise NotImplementedError('register_instance')

    def register(self, from_cls, to_cls, key=''):
        """register"""
        raise NotImplementedError('register')

    def register_scoped(self, from_cls, to_cls, key=''):
        """register scoped"""
        raise NotImplementedError('register_scoped')

    def register_singleton(self, from_cls, to_cls, key=''):
        """register singleton"""
        raise NotImplementedError('register_singleton')

    def create_scope(self):
        """create scope"""
        raise NotImplementedError('create_scope')


class Container(IContainer):
    """container implementation"""

    def __init__(self, registrations=None, singleton_instances=None, cls_lambdas=None):
        self.__scope_instances = {}
        self.__registrations = registrations if registrations is not None else {}
        self.__singleton_instances = singleton_instances if singleton_instances is not None else {}
        self.__cls_lambdas = cls_lambdas if cls_lambdas is not None else {}

    @property
    def scope_instances(self):
        return self.__scope_instances

    def all(self):
        return self.__registrations

    def register_lambda(self, from_cls, to_lambda, key=''):
        """register lambda"""
        if self.__registrations.get(from_cls, None) is None:
            self.__registrations[from_cls] = {}

        self.__registrations[from_cls][key] = to_lambda
        return self

    def register_instance(self, from_cls, instance, key=''):
        """register instance"""
        return self.register_lambda(from_cls, lambda c: instance, key)

    def register(self, from_cls, to_cls=None, key=''):
        """register"""
        if to_cls is None:
            to_cls=from_cls

        return self.register_lambda(from_cls, self.__prepare_cls_lambda(to_cls), key)

    def register_singleton(self, from_cls, to_cls=None, key=''):
        """register as singleton"""
        if to_cls is None:
            to_cls=from_cls

        scoped_lambda = self.__prepare_scoped_lambda(
            from_cls, to_cls, self.__singleton_instances, key)
        return self.register_lambda(from_cls, lambda c: scoped_lambda(
            self.__singleton_instances), key)

    def register_scoped(self, from_cls, to_cls=None, key=''):
        """register scoped"""
        if to_cls is None:
            to_cls=from_cls

        return self.register_lambda(from_cls, lambda c: self.__prepare_scoped_lambda(
            from_cls, to_cls, c.scope_instances, key)(c.scope_instances), key)

    def resolve(self, from_cls, key=''):
        """resolve"""
        return self.__registrations[from_cls][key](self)

    def resolve_all(self, from_cls):
        """resolve"""
        return [instance(self) for (key,instance) in self.__registrations[from_cls].items()]

    def create_scope(self):
        """create scope container"""
        return Container(self.__registrations, self.__singleton_instances, self.__cls_lambdas)

    def __prepare_scoped_lambda(self, from_cls, to_cls, scope, key=''):
        scope_instances = scope.get(from_cls, None)
        if scope_instances is None:
            scope_instances = {}
            scope[from_cls] = scope_instances

        cls_lambda = self.__prepare_cls_lambda(to_cls)
        return lambda scope: self.__prepare_lazy_instance(from_cls, cls_lambda, scope, key)

    def __prepare_cls_lambda(self, to_cls):
        cls_lambda = self.__cls_lambdas.get(to_cls, None)
        if cls_lambda is None:
            try:
                parameters = inspect.signature(to_cls).parameters
                annorations = {
                    key: parameters[key].annotation for key in parameters.keys()}
                self.__cls_lambdas.setdefault(to_cls, lambda scope: to_cls(
                    **{i: self.__registrations[v][''](scope) for i, v in annorations.items()}))
            except ValueError:
                self.__cls_lambdas.setdefault(to_cls, lambda scope: to_cls())
            cls_lambda = self.__cls_lambdas[to_cls]

        return cls_lambda

    def __prepare_lazy_instance(self, from_cls, cls_lambda, scope, key=''):
        instance = scope[from_cls].get(key, None)
        if instance is None:
            instance = cls_lambda(scope)
            scope[from_cls][key] = instance

        return instance


class IFactory:
    """factory interface"""

    def create(self, from_cls, key=''):
        """create"""
        raise NotImplementedError('create')

    def create_all(self, from_cls):
        """create all"""
        raise NotImplementedError('create_all')


class Factory(IFactory):
    """factory"""

    def __init__(self, factory_container: IContainer):
        self.__container = factory_container

    def create(self, from_cls, key=''):
        """create"""
        return self.__container.resolve(from_cls, key)

    def create_all(self, from_cls):
        """create all"""
        return self.__container.resolve_all(from_cls)
